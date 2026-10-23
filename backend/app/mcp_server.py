"""Run from backend: python -m app.mcp_server (loopback only)."""
from mcp.server.fastmcp import FastMCP
from .database import Base, engine
from . import models
from .copilot_tools import get_train_schedule, get_maintenance_tasks, check_block_conflict, suggest_block_window, create_block

Base.metadata.create_all(engine)
mcp = FastMCP('Railway Operations Copilot', host='127.0.0.1', port=8001, stateless_http=True, json_response=True)
for function in [get_train_schedule, get_maintenance_tasks, check_block_conflict, suggest_block_window, create_block]:
    mcp.tool()(function)

if __name__ == '__main__':
    mcp.run(transport='streamable-http')
