from typing import List, Dict


def optimize_blocks(tasks: List[Dict], corridors: List[Dict]) -> List[Dict]:
    """
    Select suitable corridor windows for maintenance tasks.

    Strategy:
    1. Higher priority tasks are considered first.
    2. Corridor must have enough available time.
    3. Allocated corridor windows are not reused.
    """

    # Highest-priority tasks first
    sorted_tasks = sorted(
        tasks,
        key=lambda task: task.get("priority_score", 0),
        reverse=True
    )

    available_corridors = [
        corridor.copy()
        for corridor in corridors
        if str(corridor.get("status", "AVAILABLE")).upper()
        == "AVAILABLE"
    ]

    plans = []

    for task in sorted_tasks:

        required_minutes = int(
            task.get("duration_minutes", 0)
        )

        for corridor in available_corridors:

            available_minutes = int(
                corridor.get("available_minutes", 0)
            )

            if available_minutes < required_minutes:
                continue

            plan = {
                "task_code": task.get("task_code"),
                "corridor": corridor.get("corridor"),
                "planned_date": corridor.get("available_date"),
                "start_time": corridor.get("start_time"),
                "end_time": corridor.get("end_time"),
                "priority_score": task.get(
                    "priority_score", 0
                ),
                "status": "PLANNED"
            }

            plans.append(plan)

            # Prevent the same corridor window
            # from being allocated again.
            corridor["status"] = "ALLOCATED"

            break

    return plans


if __name__ == "__main__":

    tasks = [
        {
            "task_code": "TASK-001",
            "duration_minutes": 60,
            "priority_score": 90
        },
        {
            "task_code": "TASK-002",
            "duration_minutes": 90,
            "priority_score": 70
        }
    ]

    corridors = [
        {
            "corridor": "DELHI-AMBALA",
            "available_date": "2026-09-20",
            "start_time": "10:00",
            "end_time": "12:00",
            "available_minutes": 120,
            "status": "AVAILABLE"
        },
        {
            "corridor": "DELHI-GHAZIABAD",
            "available_date": "2026-09-21",
            "start_time": "14:00",
            "end_time": "16:00",
            "available_minutes": 120,
            "status": "AVAILABLE"
        }
    ]

    result = optimize_blocks(
        tasks,
        corridors
    )

    for plan in result:
        print(plan)