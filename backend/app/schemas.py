from pydantic import BaseModel


class AssetCreate(BaseModel):
    asset_code: str
    asset_type: str
    department: str
    location: str
    criticality: str


class TaskCreate(BaseModel):
    task_code: str
    asset_code: str
    department: str
    description: str
    urgency: int
    criticality: int
    duration_minutes: int
    status: str = "PENDING"


class BlockRequestCreate(BaseModel):
    task_code: str
    corridor: str
    requested_date: str
    start_time: str
    end_time: str
    duration_minutes: int
    status: str = "PENDING"


class DefectCreate(BaseModel):
    defect_code: str
    asset_code: str
    department: str
    description: str
    severity: int
    reported_date: str
    status: str = "OPEN"


class TrainScheduleCreate(BaseModel):
    train_number: str
    train_name: str
    corridor: str
    train_type: str
    journey_date: str
    arrival_time: str
    departure_time: str
    train_class: str


class CorridorAvailabilityCreate(BaseModel):
    corridor: str
    department: str
    available_date: str
    start_time: str
    end_time: str
    available_minutes: int
    status: str = "AVAILABLE"


class BlockPlanCreate(BaseModel):
    task_code: str
    corridor: str
    planned_date: str
    start_time: str
    end_time: str
    priority_score: int
    status: str = "PLANNED"