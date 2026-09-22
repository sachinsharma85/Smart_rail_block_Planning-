import sys
from pathlib import Path

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import (
    Asset,
    MaintenanceTask,
    BlockRequest,
    Defect,
    TrainSchedule,
    CorridorAvailability,
    BlockPlan
)
from .schemas import (
    AssetCreate,
    TaskCreate,
    BlockRequestCreate,
    DefectCreate,
    TrainScheduleCreate,
    CorridorAvailabilityCreate,
    BlockPlanCreate
)


# =========================================================
# ML MODULE PATH
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.planner import generate_plan


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Railway Automatic Block Planning System",
    description="Backend API for automatic railway maintenance block planning",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Railway Automatic Block Planning Backend is running"
    }


# =========================================================
# ASSETS
# =========================================================

@app.post("/assets")
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db)
):
    new_asset = Asset(**asset.model_dump())

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return new_asset


@app.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


# =========================================================
# MAINTENANCE TASKS
# =========================================================

@app.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db)
):
    new_task = MaintenanceTask(**task.model_dump())

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(MaintenanceTask).all()


# =========================================================
# BLOCK REQUESTS
# =========================================================

@app.post("/block-requests")
def create_block_request(
    request: BlockRequestCreate,
    db: Session = Depends(get_db)
):
    new_request = BlockRequest(**request.model_dump())

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


@app.get("/block-requests")
def get_block_requests(db: Session = Depends(get_db)):
    return db.query(BlockRequest).all()


# =========================================================
# DEFECTS
# =========================================================

@app.post("/defects")
def create_defect(
    defect: DefectCreate,
    db: Session = Depends(get_db)
):
    new_defect = Defect(**defect.model_dump())

    db.add(new_defect)
    db.commit()
    db.refresh(new_defect)

    return new_defect


@app.get("/defects")
def get_defects(db: Session = Depends(get_db)):
    return db.query(Defect).all()


# =========================================================
# TRAIN SCHEDULE
# =========================================================

@app.post("/trains")
def create_train(
    train: TrainScheduleCreate,
    db: Session = Depends(get_db)
):
    new_train = TrainSchedule(**train.model_dump())

    db.add(new_train)
    db.commit()
    db.refresh(new_train)

    return new_train


@app.get("/trains")
def get_trains(db: Session = Depends(get_db)):
    return db.query(TrainSchedule).all()


# =========================================================
# CORRIDOR AVAILABILITY
# =========================================================

@app.post("/corridors")
def create_corridor_availability(
    corridor: CorridorAvailabilityCreate,
    db: Session = Depends(get_db)
):
    new_corridor = CorridorAvailability(**corridor.model_dump())

    db.add(new_corridor)
    db.commit()
    db.refresh(new_corridor)

    return new_corridor


@app.get("/corridors")
def get_corridor_availability(db: Session = Depends(get_db)):
    return db.query(CorridorAvailability).all()


# =========================================================
# BLOCK PLANS
# =========================================================

@app.post("/block-plans")
def create_block_plan(
    plan: BlockPlanCreate,
    db: Session = Depends(get_db)
):
    new_plan = BlockPlan(**plan.model_dump())

    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return new_plan


@app.get("/block-plans")
def get_block_plans(db: Session = Depends(get_db)):
    return db.query(BlockPlan).all()


# =========================================================
# PRIORITY CALCULATION
# =========================================================

def calculate_priority(
    urgency: int,
    criticality: int,
    severity: int = 0
):
    urgency = max(0, min(urgency, 10))
    criticality = max(0, min(criticality, 10))
    severity = max(0, min(severity, 10))

    score = (
        urgency * 0.40
        + criticality * 0.40
        + severity * 0.20
    )

    return round(score * 10, 2)
    score = (
        (urgency * 40)
        + (criticality * 40)
        + (severity * 20)
    )

    return min(score, 100)


@app.get("/priority/{urgency}/{criticality}/{severity}")
def get_priority(
    urgency: int,
    criticality: int,
    severity: int = 0
):
    score = calculate_priority(
        urgency,
        criticality,
        severity
    )

    return {
        "urgency": urgency,
        "criticality": criticality,
        "severity": severity,
        "priority_score": score
    }


# =========================================================
# TRAIN CONFLICT CHECK
# =========================================================

def has_train_conflict(
    corridor: str,
    planned_date: str,
    start_time: str,
    end_time: str,
    db: Session
):
    trains = (
        db.query(TrainSchedule)
        .filter(
            TrainSchedule.corridor == corridor,
            TrainSchedule.journey_date == planned_date
        )
        .all()
    )

    for train in trains:

        if start_time <= train.arrival_time < end_time:
            return True

        if start_time < train.departure_time <= end_time:
            return True

        if (
            train.arrival_time <= start_time
            and train.departure_time >= end_time
        ):
            return True

    return False


# =========================================================
# EXISTING AUTOMATIC BLOCK PLANNING
# =========================================================

@app.post("/planning/generate")
def generate_block_plan(
    db: Session = Depends(get_db)
):

    task = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "PENDING"
        )
        .first()
    )

    if not task:
        return {
            "message": "No pending maintenance task found"
        }

    defect = (
        db.query(Defect)
        .filter(
            Defect.asset_code == task.asset_code,
            Defect.status == "OPEN"
        )
        .first()
    )

    severity = defect.severity if defect else 0

    priority_score = calculate_priority(
        task.urgency,
        task.criticality,
        severity
    )

    corridors = (
        db.query(CorridorAvailability)
        .filter(
            CorridorAvailability.status == "AVAILABLE",
            CorridorAvailability.available_minutes
            >= task.duration_minutes
        )
        .all()
    )

    if not corridors:
        return {
            "message": "No suitable corridor availability found"
        }

    for corridor in corridors:

        conflict = has_train_conflict(
            corridor=corridor.corridor,
            planned_date=corridor.available_date,
            start_time=corridor.start_time,
            end_time=corridor.end_time,
            db=db
        )

        if conflict:
            continue

        new_plan = BlockPlan(
            task_code=task.task_code,
            corridor=corridor.corridor,
            planned_date=corridor.available_date,
            start_time=corridor.start_time,
            end_time=corridor.end_time,
            priority_score=priority_score,
            status="PLANNED"
        )

        db.add(new_plan)

        task.status = "PLANNED"
        corridor.status = "ALLOCATED"

        db.commit()
        db.refresh(new_plan)

        return new_plan

    return {
        "message": "No conflict-free corridor available for this task"
    }


# =========================================================
# AI PLANNING ENGINE
# =========================================================

@app.post("/ai/planning/generate")
def generate_ai_block_plan(
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. GET PENDING MAINTENANCE TASKS
    # -----------------------------------------------------

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "PENDING"
        )
        .all()
    )

    if not tasks:
        return {
            "message": "No pending maintenance tasks found"
        }


    # -----------------------------------------------------
    # 2. GET OPEN DEFECTS
    # -----------------------------------------------------

    defects = (
        db.query(Defect)
        .filter(
            Defect.status == "OPEN"
        )
        .all()
    )


    # -----------------------------------------------------
    # 3. GET AVAILABLE CORRIDORS
    # -----------------------------------------------------

    corridors = (
        db.query(CorridorAvailability)
        .filter(
            CorridorAvailability.status == "AVAILABLE"
        )
        .all()
    )

    if not corridors:
        return {
            "message": "No available corridors found"
        }


    # -----------------------------------------------------
    # 4. GET TRAIN SCHEDULES
    # -----------------------------------------------------

    trains = db.query(TrainSchedule).all()


    # -----------------------------------------------------
    # 5. CREATE DEFECT LOOKUP
    # -----------------------------------------------------

    defect_map = {
        defect.asset_code: defect
        for defect in defects
    }


    # -----------------------------------------------------
    # 6. PREPARE TASK DATA FOR ML ENGINE
    # -----------------------------------------------------

    task_data = []

    for task in tasks:

        defect = defect_map.get(
            task.asset_code
        )

        severity = (
            defect.severity
            if defect
            else 0
        )

        task_data.append({
            "task_code": task.task_code,
            "asset_code": task.asset_code,
            "urgency": task.urgency,
            "criticality": task.criticality,
            "severity": severity,
            "duration_minutes": task.duration_minutes,
        })


    # -----------------------------------------------------
    # 7. PREPARE CORRIDOR DATA
    # -----------------------------------------------------

    corridor_data = []

    for corridor in corridors:

        corridor_data.append({
            "corridor": corridor.corridor,
            "available_date": corridor.available_date,
            "start_time": corridor.start_time,
            "end_time": corridor.end_time,
            "available_minutes": corridor.available_minutes,
            "status": corridor.status,
        })


    # -----------------------------------------------------
    # 8. PREPARE TRAIN DATA
    # -----------------------------------------------------

    train_data = []

    for train in trains:

        train_data.append({
            "train_number": train.train_number,
            "train_name": train.train_name,
            "corridor": train.corridor,
            "journey_date": train.journey_date,
            "arrival_time": train.arrival_time,
            "departure_time": train.departure_time,
        })


    # -----------------------------------------------------
    # 9. RUN AI PLANNING ENGINE
    # -----------------------------------------------------

    result = generate_plan(
        tasks=task_data,
        corridors=corridor_data,
        trains=train_data
    )


    # -----------------------------------------------------
    # 10. SAVE SAFE PLANS TO DATABASE
    # -----------------------------------------------------

    created_plans = []

    for plan in result.get("plans", []):

        task_code = plan.get("task_code")

        task = (
            db.query(MaintenanceTask)
            .filter(
                MaintenanceTask.task_code == task_code
            )
            .first()
        )

        if not task:
            continue

        corridor = (
            db.query(CorridorAvailability)
            .filter(
                CorridorAvailability.corridor
                == plan.get("corridor"),

                CorridorAvailability.available_date
                == plan.get("planned_date"),

                CorridorAvailability.start_time
                == plan.get("start_time"),

                CorridorAvailability.end_time
                == plan.get("end_time"),

                CorridorAvailability.status
                == "AVAILABLE"
            )
            .first()
        )

        if not corridor:
            continue

        new_plan = BlockPlan(
            task_code=task_code,
            corridor=plan.get("corridor"),
            planned_date=plan.get("planned_date"),
            start_time=plan.get("start_time"),
            end_time=plan.get("end_time"),
            priority_score=int(
                round(
                    plan.get(
                        "priority_score",
                        0
                    )
                )
            ),
            status="PLANNED"
        )

        db.add(new_plan)

        task.status = "PLANNED"
        corridor.status = "ALLOCATED"

        db.commit()
        db.refresh(new_plan)

        created_plans.append({
            "id": new_plan.id,
            "task_code": new_plan.task_code,
            "corridor": new_plan.corridor,
            "planned_date": new_plan.planned_date,
            "start_time": new_plan.start_time,
            "end_time": new_plan.end_time,
            "priority_score": new_plan.priority_score,
            "status": new_plan.status
        })


    # -----------------------------------------------------
    # 11. FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "message": "AI block planning completed",

        "summary": {
            "total_tasks": result.get(
                "total_tasks",
                0
            ),

            "tasks_with_priority": result.get(
                "tasks_with_priority",
                0
            ),

            "optimized_plans": result.get(
                "optimized_plans",
                0
            ),

            "conflicts_detected": result.get(
                "conflicts_detected",
                0
            ),

            "final_safe_plans": result.get(
                "final_safe_plans",
                0
            ),

            "plans_saved_to_database": len(
                created_plans
            )
        },

        "plans": created_plans,

        "conflicts": result.get(
            "conflicts",
            []
        )
    }