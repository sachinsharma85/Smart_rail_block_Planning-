from sqlalchemy import Column, Integer, String
from .database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String, unique=True, index=True)
    asset_type = Column(String)
    department = Column(String)
    location = Column(String)
    criticality = Column(String)


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String, unique=True, index=True)
    asset_code = Column(String)
    department = Column(String)
    description = Column(String)
    urgency = Column(Integer)
    criticality = Column(Integer)
    duration_minutes = Column(Integer)
    status = Column(String)


class BlockRequest(Base):
    __tablename__ = "block_requests"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String)
    corridor = Column(String)
    requested_date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    duration_minutes = Column(Integer)
    status = Column(String)


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    defect_code = Column(String, unique=True, index=True)
    asset_code = Column(String)
    department = Column(String)
    description = Column(String)
    severity = Column(Integer)
    reported_date = Column(String)
    status = Column(String)


class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, index=True)
    train_name = Column(String)
    corridor = Column(String)
    train_type = Column(String)
    journey_date = Column(String)
    arrival_time = Column(String)
    departure_time = Column(String)
    train_class = Column(String)


class CorridorAvailability(Base):
    __tablename__ = "corridor_availability"

    id = Column(Integer, primary_key=True, index=True)
    corridor = Column(String, index=True)
    department = Column(String)
    available_date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    available_minutes = Column(Integer)
    status = Column(String, default="AVAILABLE")


class BlockPlan(Base):
    __tablename__ = "block_plans"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String, index=True)
    corridor = Column(String)
    planned_date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    priority_score = Column(Integer)
    status = Column(String, default="PLANNED")