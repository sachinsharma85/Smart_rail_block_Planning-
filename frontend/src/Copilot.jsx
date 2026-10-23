import {useState} from 'react';
import './Copilot.css';
export default function Copilot({api, onSaved}) {
 const [open,setOpen]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState('');
 const [messages,setMessages]=useState([]), [proposal,setProposal]=useState(null), [text,setText]=useState('');
 const [form,setForm]=useState({corridor:'',date:new Date().toLocaleDateString('en-CA'),start_time:'11:00',duration_minutes:90,task_code:''});
 const [tasks,setTasks]=useState([]),[corridors,setCorridors]=useState([]);
 const [ai,setAi]=useState(true),[history,setHistory]=useState([]),[chat,setChat]=useState([]);
 async function call(tool,arguments_) {
   const res=await fetch(`${api}/copilot/tool`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool,arguments:arguments_})});
   const data=await res.json(); if(!res.ok)throw Error(data.detail || 'Request failed');
   return data;
 }
 async function run(tool,args=form) {
  setBusy(true);setError('');setProposal(null);
  try {
   const response=await call(tool,args), result=response.result;
   setMessages(old=>[...old,{tool,result}]);
   if(tool==='get_maintenance_tasks'){setTasks(result.tasks);setCorridors(result.corridors);}
   if(tool==='check_block_conflict' && result.feasible)setProposal(result);
   if(tool==='suggest_block_window')setProposal(result.alternatives?.[0] || null);
   if(result.created)onSaved();
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function command(e){e.preventDefault();if(!ai){const input=text.toLowerCase();setText('');if(input.includes('train'))run('get_train_schedule',{corridor:form.corridor,date:form.date});else if(input.includes('task'))run('get_maintenance_tasks',{});else if(input.includes('suggest'))run('suggest_block_window');else run('check_block_conflict');return;}
 const question=text;setText('');setBusy(true);setError('');setProposal(null);setChat(old=>[...old,{role:'user',text:question}]);
 try{const res=await fetch(`${api}/copilot/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,history})});const data=await res.json();if(!res.ok)throw Error(data.detail||'Chat failed');
 setHistory(old=>[...old,{role:'user',text:question},{role:'assistant',text:data.reply}]);setChat(old=>[...old,{role:'assistant',text:data.reply}]);setMessages(old=>[...old,...(data.trace||[])]);setProposal(data.proposals?.[0]||null);
 }catch(e){setError(e.message);}finally{setBusy(false);}
 }

 return <><button className="rail-launch" onClick={()=>{setOpen(!open);if(!open)run('get_maintenance_tasks',{});}}>✦ Railway Copilot</button>
 {open&&<section className="rail-copilot" aria-label="Railway Copilot"><header><div><b>Railway Operations Copilot</b><small>Bedrock conversation · Live MCP tools</small></div><button onClick={()=>setOpen(false)} aria-label="Close copilot">✕</button></header>
 <div className="rail-body"><p className="rail-note">Planning prototype using recorded data. Operator review required. AI chat needs working AWS Bedrock access; tool buttons work independently.</p>
 <label><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/> Use Bedrock AI chat</label><div className="rail-fields">{Object.entries(form).map(([key,value])=><label key={key}>{key.replaceAll('_',' ')}{key==='task_code'?<select value={value} onChange={e=>{setProposal(null);setForm({...form,[key]:e.target.value});}}><option value="">Select task</option>{tasks.map(t=><option key={t.id} value={t.task_code}>{t.task_code} ({t.duration_minutes} min)</option>)}</select>:<input list={key==='corridor'?'rail-corridors':undefined} type={key==='date'?'date':key==='start_time'?'time':key==='duration_minutes'?'number':'text'} min={key==='duration_minutes'?1:undefined} max={key==='duration_minutes'?720:undefined} value={value} onChange={e=>{setProposal(null);setForm({...form,[key]:key==='duration_minutes'?Number(e.target.value):e.target.value});}}/>}</label>)}<datalist id="rail-corridors">{corridors.map(c=><option key={c} value={c}/>)}</datalist></div>
 <div className="rail-actions">{[['Trains','get_train_schedule'],['Tasks','get_maintenance_tasks'],['Check conflicts','check_block_conflict'],['Suggest window','suggest_block_window']].map(([label,tool])=><button key={tool} disabled={busy} onClick={()=>run(tool,tool==='get_maintenance_tasks'?{}:tool==='get_train_schedule'?{corridor:form.corridor,date:form.date}:form)}>{label}</button>)}</div>
 <div aria-live="polite">{chat.map((m,i)=><article className="rail-result" key={`chat-${i}`}><b>{m.role==='user'?'You':'Copilot'}</b><p style={{whiteSpace:'pre-wrap'}}>{m.text}</p></article>)}{messages.map((m,i)=><article className="rail-result" key={i}><small>MCP · {m.tool}</small>{m.result.feasible!==undefined&&<h3>{m.result.feasible?'No recorded conflicts':'Requested window unavailable'}</h3>}{m.result.created&&<h3>Block saved ✓</h3>}<pre>{JSON.stringify(m.result,null,2)}</pre></article>)}</div>
 {proposal&&<div className="rail-approval"><b>Review proposed block</b><p>{proposal.corridor} · {proposal.date}<br/>{proposal.start_time}–{proposal.end_time} · {proposal.task_code || 'Select a task before saving'}</p><button disabled={busy||!proposal.task_code} onClick={()=>run('create_block',{corridor:proposal.corridor,date:proposal.date,start_time:proposal.start_time,duration_minutes:proposal.duration_minutes,task_code:proposal.task_code,confirmed:true})}>Approve & save block</button></div>}
 {busy&&<p role="status">Calling railway MCP server…</p>}{error&&<p role="alert" className="rail-error">{error}</p>}
 <form onSubmit={command} className="rail-command"><input aria-label="Guided command" placeholder={ai?"Ask about a maintenance block…":"Try: check conflicts"} value={text} onChange={e=>setText(e.target.value)}/><button disabled={busy||!text.trim()}>Send</button></form></div></section>}</>;
}
