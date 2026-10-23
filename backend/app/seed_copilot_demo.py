"""Explicit opt-in synthetic demo data; never replaces existing records."""
from datetime import date
from .database import Base, engine, SessionLocal
from .models import MaintenanceTask, CorridorAvailability, TrainSchedule
Base.metadata.create_all(engine)
day = date.today().isoformat()
with SessionLocal() as db:
    if not db.query(MaintenanceTask).filter_by(task_code='DEMO-RAIL-01').first():
        db.add(MaintenanceTask(task_code='DEMO-RAIL-01', asset_code='DEMO-ASSET', department='Engineering', description='SYNTHETIC DEMO: track inspection', urgency=7, criticality=7, duration_minutes=90, status='PENDING'))
    if not db.query(CorridorAvailability).filter_by(corridor='DEMO-CORRIDOR', available_date=day).first():
        db.add(CorridorAvailability(corridor='DEMO-CORRIDOR', department='Engineering', available_date=day, start_time='09:00', end_time='18:00', available_minutes=540, status='AVAILABLE'))
        db.add(TrainSchedule(train_number='DEMO-TRAIN', train_name='Synthetic demo train', corridor='DEMO-CORRIDOR', train_type='DEMO', journey_date=day, arrival_time='11:15', departure_time='11:45', train_class='DEMO'))
    db.commit()
print(f'Synthetic data ready: DEMO-CORRIDOR / DEMO-RAIL-01 / {day}. Check 11:00 for 90 minutes; alternative 11:45.')
