"""Bedrock agent: only read/proposal tools are exposed to the model."""
import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException
from pydantic import BaseModel, Field
from .copilot_api import router, call_tool, ToolRequest

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[dict] = Field(default_factory=list, max_length=40)

# Explicitly scoped tools. The model cannot save blocks; the approval endpoint does.
TOOLS = [
 {'toolSpec': {'name':'get_maintenance_tasks','description':'Get pending tasks and available corridor names. Use to discover task codes.', 'inputSchema':{'json':{'type':'object','properties':{}}}}},
]
for name,description in [
 ('get_train_schedule','Get recorded train schedules for corridor/date.'),
 ('check_block_conflict','Check the requested window against recorded trains, blocks and department availability.'),
 ('suggest_block_window','Find later feasible windows on the requested day; returns requested conflicts and alternatives.')]:
 properties={'corridor':{'type':'string'},'date':{'type':'string','description':'YYYY-MM-DD, India local date'}}
 required=['corridor','date']
 if name!='get_train_schedule':
  properties.update({'start_time':{'type':'string','description':'24-hour HH:MM'},'duration_minutes':{'type':'integer'},'task_code':{'type':'string','description':'Known maintenance task code'}})
  required+=['start_time','duration_minutes','task_code']
 TOOLS.append({'toolSpec':{'name':name,'description':description,'inputSchema':{'json':{'type':'object','properties':properties,'required':required}}}})

@router.post('/chat')
async def chat(request: ChatRequest):
    # Client history is text-only; tool outputs are always obtained fresh from MCP.
    messages=[]
    for item in request.history[-20:]:
        if item.get('role') in ['user','assistant'] and isinstance(item.get('text'),str):
            role=item['role'];content={'text':item['text'][:6000]}
            if messages and messages[-1]['role']==role:
                messages[-1]['content'].append(content)
            else:
                messages.append({'role':role,'content':[content]})
    if messages and messages[-1]['role']=='user':
        messages[-1]['content'].append({'text':request.message})
    else:
        messages.append({'role':'user','content':[{'text':request.message}]})
    if messages[0]['role']!='user': messages=messages[1:]
    today=datetime.now(ZoneInfo('Asia/Kolkata')).date().isoformat()
    system=f'''You are Railway Operations Copilot, a recorded-data planning prototype. Today in India is {today}. Interpret tomorrow relative to this date. Keep conversational context, but never trust old messages as current operational data. Discover real tasks and corridors through tools; ask concise clarification for missing corridor, task, date, start or duration. Never invent train numbers, timings, team availability or results. All conflict calculations must use tools. Say "no recorded conflicts", never claim operational safety. Explain conflict references and timings in simple language. If feasible windows are found, describe them and ask the operator to review the proposal card and click Approve & save. You cannot save or approve blocks. Do not say a plan was saved. Respond in the user's language. A corridor is not an individual track. No live signalling or crew data is connected.'''
    trace=[];proposals=[]
    import asyncio
    try:
        client=boto3.client('bedrock-runtime',region_name=os.getenv('AWS_REGION','us-east-1'))
        for _ in range(6):
            response=await asyncio.to_thread(client.converse,modelId=os.getenv('BEDROCK_MODEL_ID','us.amazon.nova-lite-v1:0'),system=[{'text':system}],messages=messages,toolConfig={'tools':TOOLS},inferenceConfig={'maxTokens':1200,'temperature':0})
            answer=response['output']['message'];messages.append(answer)
            uses=[b['toolUse'] for b in answer['content'] if 'toolUse' in b]
            if not uses:
                return {'reply':'\n'.join(b['text'] for b in answer['content'] if 'text' in b),'trace':trace,'proposals':proposals}
            results=[]
            for use in uses:
                name=use['name'];args=use.get('input',{})
                if name not in {t['toolSpec']['name'] for t in TOOLS}:
                    value={'error':'Tool is not permitted'};status='error'
                else:
                    try:
                        response=await call_tool(ToolRequest(tool=name,arguments=args))
                        value=response['result'];status='success';trace.append({'tool':name,'arguments':args,'result':value})
                        if name=='suggest_block_window':proposals=value.get('alternatives',[])
                        elif name=='check_block_conflict':proposals=[value] if value.get('feasible') else []
                    except HTTPException as e:
                        value={'error':e.detail};status='error'
                results.append({'toolResult':{'toolUseId':use['toolUseId'],'content':[{'json':value}],'status':status}})
            messages.append({'role':'user','content':results})
        raise HTTPException(422,'Too many tool steps. Please narrow the request.')
    except NoCredentialsError:
        raise HTTPException(503,'AWS credentials are not configured on this computer. Use your local AWS profile; never paste credentials into chat.')
    except ClientError as e:
        code=e.response.get('Error',{}).get('Code','AWS error')
        msg=e.response.get('Error',{}).get('Message','Bedrock request failed')
        raise HTTPException(503,f'Bedrock {code}: {msg}')
