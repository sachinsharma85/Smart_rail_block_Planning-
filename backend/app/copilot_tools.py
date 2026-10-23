"""Database-backed planning tools. Prototype; operator review is required."""
from datetime import datetime, timedelta
from threading import Lock
from .database import SessionLocal
from .models import TrainSchedule, MaintenanceTask, BlockPlan, CorridorAvailability

WRITE_LOCK = Lock()

def rows(items):
    return [{c.name: getattr(x, c.name) for c in x.__table__.columns} for x in items]

def stamp(day, time):
    return datetime.fromisoformat(f'{day}T{time}')

def interval(day, start, end):
    a, b = stamp(day, start), stamp(day, end)
    return a, b + timedelta(days=1) if b <= a else b

def get_train_schedule(corridor: str, date: str) -> dict:
    """Read train movements for a corridor and ISO date."""
    datetime.strptime(date, '%Y-%m-%d')
    with SessionLocal() as db:
        return {'trains': rows(db.query(TrainSchedule).filter_by(corridor=corridor, journey_date=date).all())}

def get_maintenance_tasks() -> dict:
    """Read pending maintenance tasks and known corridors."""
    with SessionLocal() as db:
        corridors = sorted({x[0] for x in db.query(CorridorAvailability.corridor).all() if x[0]})
        return {'tasks': rows(db.query(MaintenanceTask).filter(MaintenanceTask.status.notin_(['COMPLETED', 'CANCELLED'])).all()), 'corridors': corridors}

def check_block_conflict(corridor: str, date: str, start_time: str, duration_minutes: int, task_code: str = '') -> dict:
    """Check trains, saved plans and department availability; fail closed on missing availability."""
    if not 1 <= duration_minutes <= 720:
        raise ValueError('Duration must be 1–720 minutes')
    start = stamp(date, start_time)
    end = start + timedelta(minutes=duration_minutes)
    if end.date() != start.date():
        raise ValueError('Requested blocks must end on the same day')
    conflicts = []
    with SessionLocal() as db:
        task = db.query(MaintenanceTask).filter_by(task_code=task_code).first() if task_code else None
        if task_code and not task:
            raise ValueError('Unknown task code')
        if task and (task.status in ['COMPLETED', 'CANCELLED'] or duration_minutes < task.duration_minutes):
            raise ValueError('Task is closed or requested duration is shorter than the task')
        previous = (start - timedelta(days=1)).date().isoformat()
        for train in db.query(TrainSchedule).filter(TrainSchedule.corridor == corridor, TrainSchedule.journey_date.in_([previous, date])).all():
            a, b = interval(train.journey_date, train.arrival_time, train.departure_time)
            if start < b and end > a:
                conflicts.append({'type': 'train', 'reference': train.train_number, 'start': a.isoformat(), 'end': b.isoformat()})
        for plan in db.query(BlockPlan).filter(BlockPlan.corridor == corridor, BlockPlan.planned_date.in_([previous, date]), BlockPlan.status.notin_(['CANCELLED', 'COMPLETED'])).all():
            a, b = interval(plan.planned_date, plan.start_time, plan.end_time)
            if start < b and end > a:
                conflicts.append({'type': 'block', 'reference': plan.task_code, 'start': a.isoformat(), 'end': b.isoformat()})
        windows = db.query(CorridorAvailability).filter_by(corridor=corridor, available_date=date, status='AVAILABLE').all()
        if task:
            windows = [w for w in windows if w.department == task.department]
        covered = any(a <= start and end <= b for a, b in [interval(date, w.start_time, w.end_time) for w in windows])
        if not covered:
            conflicts.append({'type': 'availability', 'reference': 'No matching recorded availability covers this window'})
    return {'feasible': not conflicts, 'corridor': corridor, 'date': date, 'start_time': start.strftime('%H:%M'), 'end_time': end.strftime('%H:%M'), 'duration_minutes': duration_minutes, 'task_code': task_code, 'conflicts': conflicts, 'scope': 'Recorded corridor data only; no live signalling, crew or physical safety verification.'}

def suggest_block_window(corridor: str, date: str, start_time: str, duration_minutes: int, task_code: str = '') -> dict:
    """Find up to three later windows in 5-minute steps on the requested day."""
    initial = check_block_conflict(corridor, date, start_time, duration_minutes, task_code)
    start = stamp(date, start_time)
    choices = []
    while start.date().isoformat() == date and len(choices) < 3:
        if (start + timedelta(minutes=duration_minutes)).date() != start.date():
            break
        result = check_block_conflict(corridor, date, start.strftime('%H:%M'), duration_minutes, task_code)
        if result['feasible']:
            choices.append(result)
            start += timedelta(minutes=duration_minutes)
        else:
            start += timedelta(minutes=5)
    return {'requested': initial, 'alternatives': choices}

def create_block(corridor: str, date: str, start_time: str, duration_minutes: int, task_code: str, confirmed: bool = False) -> dict:
    """Save only after explicit operator confirmation and a fresh conflict check."""
    if confirmed is not True:
        raise ValueError('Explicit operator approval required')
    if not task_code:
        raise ValueError('Select a maintenance task')
    with WRITE_LOCK:
        result = check_block_conflict(corridor, date, start_time, duration_minutes, task_code)
        if not result['feasible']:
            return {'created': False, **result}
        with SessionLocal() as db:
            existing = db.query(BlockPlan).filter_by(task_code=task_code).filter(BlockPlan.status.notin_(['CANCELLED', 'COMPLETED'])).first()
            if existing:
                return {'created': False, 'reason': 'Task already has an active plan'}
            plan = BlockPlan(task_code=task_code, corridor=corridor, planned_date=date, start_time=result['start_time'], end_time=result['end_time'], priority_score=0, status='PLANNED')
            db.add(plan)
            db.commit()
            db.refresh(plan)
            return {'created': True, 'plan': rows([plan])[0]}
