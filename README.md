# Railway Operations Copilot

Railway maintenance planning prototype with a working MCP server,
train conflict checks, alternative windows and operator-approved saving.

## Setup

Requires Python 3.12+ and Node.js 22.12+.
Clone the submission branch:

git clone --branch hackathon-copilot https://github.com/sachinsharma85/Smart_rail_block_Planning-.git
cd Smart_rail_block_Planning-

Create the Python environment and install dependencies:

python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r requirements.txt

## Run — three separate terminals

Terminal 1, from the repository root:

source backend/venv/bin/activate
cd backend
unset DATABASE_URL
python3 -m app.seed_copilot_demo
python3 -m app.mcp_server

Terminal 2, from the repository root:

source backend/venv/bin/activate
cd backend
unset DATABASE_URL
python3 -m uvicorn app.main:app --reload --port 8000

Terminal 3, from the repository root:

cd frontend
npm ci
npm run dev

Open the Local URL printed by Vite. Keep all three terminals running.

## Existing SQLite database

If startup reports a missing train_class column, stop the Python
servers and run the following from the backend directory:

python3 - <<'PY'
import sqlite3
from datetime import datetime
from app.database import engine

if engine.dialect.name != "sqlite":
    raise RuntimeError("This migration is for SQLite only")

path = engine.url.database
db = sqlite3.connect(path)
columns = {row[1] for row in db.execute("PRAGMA table_info(train_schedules)")}
if not columns:
    raise RuntimeError("train_schedules table not found")
if "train_class" not in columns:
    backup_path = f"{path}.backup-{datetime.now():%Y%m%d%H%M%S}"
    with sqlite3.connect(backup_path) as backup:
        db.backup(backup)
    db.execute("ALTER TABLE train_schedules ADD COLUMN train_class TEXT")
    db.commit()
    print("Migration complete. Backup:", backup_path)
db.close()
PY

Then rerun the seed command and start both Python servers.

## Demo

The seed command adds clearly named synthetic data for today's date.
Open Railway Copilot and uncheck "Use Bedrock AI chat".

Select DEMO-CORRIDOR, DEMO-RAIL-01, today's date, 11:00,
and 90 minutes. Check conflicts, suggest a window, review the
proposal, then approve and save.

An existing active plan for that task prevents duplicate saving.
For repeat demos, create a new pending Engineering task through
POST /tasks at http://127.0.0.1:8000/docs with a unique task_code
and duration_minutes of 90. Select that task in Copilot.
Existing saved blocks may change the alternative windows.

## MCP integration

Endpoint: http://127.0.0.1:8001/mcp
Transport: Streamable HTTP
Verified protocol negotiation: 2025-11-25

Tools:
- get_train_schedule
- get_maintenance_tasks
- check_block_conflict
- suggest_block_window
- create_block

The web backend invokes the actual MCP server through the official
Python MCP client. The conversational model cannot call create_block;
saving requires a separate operator action.

## Optional Amazon Bedrock conversation

Configure an authorized local AWS credential profile privately.
Set AWS_REGION and BEDROCK_MODEL_ID in the backend terminal.

Example:
export AWS_REGION=us-east-1
export BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0

Bedrock conversation code is included, but live Bedrock integration
has not been verified because account access is currently blocked.
The MCP tool buttons work without Bedrock. AWS usage may incur charges.

## Validation

From the repository root, with the Python environment active:

python3 -m pip install pytest
python3 -m pytest test/test_copilot.py -q

Frontend production build:

cd frontend
npm run build

## Limitations

Synthetic and recorded corridor data only; no live signalling,
crew availability or track-level safety verification.
Conflict-free means no conflicts in the recorded data.
Copilot priority_score currently defaults to zero.
Existing legacy planning endpoints retain their original behavior.
This unauthenticated local prototype is not a production control system.

## Hackathon contribution

The existing railway dashboard and planning code were extended with
MCP tools, a Copilot panel, conflict-based alternatives, operator
approval, optional Bedrock conversation code and tests.
Original project contributors retain credit for their work.
