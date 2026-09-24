from typing import List, Dict

from .priority_model import (
    calculate_priority,
    get_priority_level,
)

from .optimizer import optimize_blocks

from .conflict_resolver import (
    find_conflicts,
    remove_conflicting_plans,
)


def prepare_tasks(tasks: List[Dict]) -> List[Dict]:
    """
    Calculate priority score for every maintenance task.
    """

    prepared_tasks = []

    for task in tasks:

        urgency = int(
            task.get("urgency", 0)
        )

        criticality = int(
            task.get("criticality", 0)
        )

        severity = int(
            task.get("severity", 0)
        )

        priority_score = calculate_priority(
            urgency=urgency,
            criticality=criticality,
            severity=severity,
        )

        prepared_task = task.copy()

        prepared_task["priority_score"] = (
            priority_score
        )

        prepared_task["priority_level"] = (
            get_priority_level(
                priority_score
            )
        )

        prepared_tasks.append(
            prepared_task
        )

    return prepared_tasks


def generate_plan(
    tasks: List[Dict],
    corridors: List[Dict],
    trains: List[Dict],
) -> Dict:
    """
    Complete AI planning pipeline.

    Steps:
        1. Calculate priority
        2. Optimize corridor allocation
        3. Detect train conflicts
        4. Remove conflicting plans
        5. Return final safe plans
    """

    # -----------------------------------------
    # STEP 1: PRIORITY
    # -----------------------------------------

    prepared_tasks = prepare_tasks(tasks)

    # -----------------------------------------
    # STEP 2: OPTIMIZATION
    # -----------------------------------------

    optimized_plans = optimize_blocks(
        prepared_tasks,
        corridors,
        trains,
    )

    # -----------------------------------------
    # STEP 3: CONFLICT DETECTION
    # -----------------------------------------

    conflicts = find_conflicts(
        optimized_plans,
        trains,
    )

    # -----------------------------------------
    # STEP 4: REMOVE CONFLICTS
    # -----------------------------------------

    safe_plans = remove_conflicting_plans(
        optimized_plans,
        trains,
    )

    # -----------------------------------------
    # STEP 5: FINAL RESULT
    # -----------------------------------------

    return {
        "total_tasks": len(tasks),

        "tasks_with_priority": len(
            prepared_tasks
        ),

        "optimized_plans": len(
            optimized_plans
        ),

        "conflicts_detected": len(
            conflicts
        ),

        "final_safe_plans": len(
            safe_plans
        ),

        "conflicts": conflicts,

        "plans": safe_plans,
    }


if __name__ == "__main__":

    # -----------------------------------------
    # DEMO MAINTENANCE TASKS
    # -----------------------------------------

    tasks = [
        {
            "task_code": "TASK-001",
            "urgency": 9,
            "criticality": 9,
            "severity": 9,
            "duration_minutes": 60,
        },
        {
            "task_code": "TASK-002",
            "urgency": 6,
            "criticality": 7,
            "severity": 5,
            "duration_minutes": 60,
        },
    ]

    # -----------------------------------------
    # DEMO CORRIDOR WINDOWS
    # -----------------------------------------

    corridors = [
        {
            "corridor": "DELHI-AMBALA",
            "available_date": "2026-09-20",
            "start_time": "10:00",
            "end_time": "12:00",
            "available_minutes": 120,
            "status": "AVAILABLE",
        },
        {
            "corridor": "DELHI-GHAZIABAD",
            "available_date": "2026-09-21",
            "start_time": "14:00",
            "end_time": "16:00",
            "available_minutes": 120,
            "status": "AVAILABLE",
        },
    ]

    # -----------------------------------------
    # DEMO TRAIN SCHEDULE
    # -----------------------------------------

    trains = [
        {
            "train_number": "12001",
            "train_name": "Demo Express",
            "corridor": "DELHI-AMBALA",
            "journey_date": "2026-09-20",
            "arrival_time": "11:00",
            "departure_time": "11:30",
        }
    ]

    # -----------------------------------------
    # RUN PLANNING ENGINE
    # -----------------------------------------

    result = generate_plan(
        tasks=tasks,
        corridors=corridors,
        trains=trains,
    )

    # -----------------------------------------
    # DISPLAY RESULT
    # -----------------------------------------

    print("\n===================================")
    print(" SMART RAIL AI PLANNING ENGINE")
    print("===================================\n")

    print(
        "Total Tasks:",
        result["total_tasks"]
    )

    print(
        "Tasks With Priority:",
        result["tasks_with_priority"]
    )

    print(
        "Optimized Plans:",
        result["optimized_plans"]
    )

    print(
        "Conflicts Detected:",
        result["conflicts_detected"]
    )

    print(
        "Final Safe Plans:",
        result["final_safe_plans"]
    )

    print("\n-----------------------------------")
    print("FINAL SAFE BLOCK PLANS")
    print("-----------------------------------\n")

    for plan in result["plans"]:
        print(plan)

    print("\n-----------------------------------")
    print("CONFLICTS")
    print("-----------------------------------\n")

    for conflict in result["conflicts"]:
        print(conflict)
