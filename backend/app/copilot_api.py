import json
import httpx
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

def local_http_client(**kwargs):
    return httpx.AsyncClient(trust_env=False, **kwargs)

router = APIRouter(prefix='/copilot', tags=['Railway Copilot'])

class ToolRequest(BaseModel):
    tool: Literal['get_train_schedule', 'get_maintenance_tasks', 'check_block_conflict', 'suggest_block_window', 'create_block']
    arguments: dict = Field(default_factory=dict)

@router.post('/tool')
async def call_tool(request: ToolRequest):
    try:
        async with streamablehttp_client('http://127.0.0.1:8001/mcp', httpx_client_factory=local_http_client) as (read, write, _):
            async with ClientSession(read, write) as session:
                info = await session.initialize()
                result = await session.call_tool(request.tool, request.arguments)
                if result.isError:
                    raise HTTPException(400, detail=' '.join(c.text for c in result.content if hasattr(c, 'text')))
                data = result.structuredContent
                if data is None:
                    data = json.loads(next(c.text for c in result.content if hasattr(c, 'text')))
                return {'tool': request.tool, 'transport': 'MCP Streamable HTTP', 'server': info.serverInfo.name, 'result': data}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, detail='MCP service unavailable. Start: python -m app.mcp_server (backend folder).')
