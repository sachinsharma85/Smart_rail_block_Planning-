import os
import tempfile
import sys
from pathlib import Path
os.environ['DATABASE_URL'] = 'sqlite:///' + tempfile.mktemp(suffix='.db')
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from app.database import Base, engine, SessionLocal
from app.models import MaintenanceTask, CorridorAvailability, TrainSchedule
from app.copilot_tools import check_block_conflict, suggest_block_window, create_block

def test_planning_lifecycle():
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add(MaintenanceTask(task_code='TEST-01', department='ENG', duration_minutes=60, status='PENDING'))
        db.add(CorridorAvailability(corridor='TEST', department='ENG', available_date='2026-10-23', start_time='09:00', end_time='18:00', status='AVAILABLE'))
        db.add(TrainSchedule(train_number='123', corridor='TEST', journey_date='2026-10-23', arrival_time='11:15', departure_time='11:45'))
        db.commit()
    args=dict(corridor='TEST',date='2026-10-23',start_time='11:00',duration_minutes=60,task_code='TEST-01')
    assert not check_block_conflict(**args)['feasible']
    suggestions=suggest_block_window(**args)['alternatives']
    assert suggestions[0]['start_time']=='11:45'
    try:
        create_block(**args)
        assert False, 'Unapproved write accepted'
    except ValueError:
        pass
    args['start_time']='11:45'
    assert create_block(**args,confirmed=True)['created']
    assert not create_block(**args,confirmed=True)['created']
    args['start_time']='10:00'
    assert not create_block(**args,confirmed=True)['created']
    args['corridor']='MISSING'
    assert not check_block_conflict(**args)['feasible']
    args['corridor']='TEST';args['start_time']='10:00';args['duration_minutes']=30
    try:
        check_block_conflict(**args)
        assert False
    except ValueError:
        pass

def test_agent_uses_tools_without_write_access(monkeypatch):
    import asyncio
    from app import bedrock_chat as agent
    responses = iter([
        {'output': {'message': {'role': 'assistant', 'content': [{'toolUse': {'toolUseId':'one','name':'get_maintenance_tasks','input':{}}}]}}},
        {'output': {'message': {'role':'assistant','content':[{'text':'Task data retrieved.'}]}}}
    ])
    class FakeClient:
        def converse(self, **kwargs):
            assert 'create_block' not in [t['toolSpec']['name'] for t in kwargs['toolConfig']['tools']]
            return next(responses)
    async def fake_tool(request):
        assert request.tool == 'get_maintenance_tasks'
        return {'result': {'tasks': [], 'corridors': ['TEST']}}
    monkeypatch.setattr(agent.boto3,'client',lambda *a,**k:FakeClient())
    monkeypatch.setattr(agent,'call_tool',fake_tool)
    result=asyncio.run(agent.chat(agent.ChatRequest(message='Show tasks')))
    assert result['reply']=='Task data retrieved.'
    assert result['trace'][0]['tool']=='get_maintenance_tasks'
