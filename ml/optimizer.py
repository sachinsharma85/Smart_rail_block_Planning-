from typing import List, Dict

from .conflict_resolver import is_time_conflict


def optimize_blocks(
    tasks: List[Dict],
    corridors: List[Dict],
    trains: List[Dict]
) -> List[Dict]:
    """
    Select the best feasible corridor window for each maintenance task.

    Strategy:
    1. Process higher-priority tasks first.
    2. Check every available corridor window.
    3. Reject windows that are too short.
    4. Reject windows that conflict with train movement.
    5. Score remaining windows.
    6. Select the highest-scoring feasible window.
    """

    # -----------------------------------------
    # STEP 1: SORT TASKS BY PRIORITY
    # -----------------------------------------

    sorted_tasks = sorted(
        tasks,
        key=lambda task: task.get("priority_score", 0),
        reverse=True
    )

    # -----------------------------------------
    # STEP 2: GET AVAILABLE CORRIDOR WINDOWS
    # -----------------------------------------

    available_corridors = [
        corridor.copy()
        for corridor in corridors
        if str(
            corridor.get("status", "AVAILABLE")
        ).upper() == "AVAILABLE"
    ]

    plans = []

    # -----------------------------------------
    # STEP 3: PROCESS EACH TASK
    # -----------------------------------------

    for task in sorted_tasks:

        required_minutes = int(
            task.get("duration_minutes", 0)
        )

        best_window = None
        best_score = float("-inf")

        # -----------------------------------------
        # STEP 4: EVALUATE EVERY WINDOW
        # -----------------------------------------

        for corridor in available_corridors:

            if str(
                corridor.get("status", "AVAILABLE")
            ).upper() != "AVAILABLE":
                continue

            available_minutes = int(
                corridor.get("available_minutes", 0)
            )

            # Window must be long enough
            if available_minutes < required_minutes:
                continue

            corridor_name = corridor.get("corridor")
            planned_date = corridor.get("available_date")
            start_time = corridor.get("start_time")
            end_time = corridor.get("end_time")

            # -----------------------------------------
            # STEP 5: TRAIN CONFLICT CHECK
            # -----------------------------------------

            conflict = False

            for train in trains:

                if (
                    corridor_name
                    != train.get("corridor")
                ):
                    continue

                if (
                    planned_date
                    != train.get("journey_date")
                ):
                    continue

                if is_time_conflict(
                    start_time,
                    end_time,
                    train.get("arrival_time"),
                    train.get("departure_time")
                ):
                    conflict = True
                    break

            if conflict:
                continue

            # -----------------------------------------
            # STEP 6: WINDOW SCORING
            # -----------------------------------------

            priority_score = float(
                task.get("priority_score", 0)
            )

            # Prefer windows with less unused capacity.
            unused_minutes = (
                available_minutes
                - required_minutes
            )

            # Higher priority + better time utilization
            window_score = (
                priority_score * 100
                - unused_minutes
            )

            # -----------------------------------------
            # STEP 7: SELECT BEST WINDOW
            # -----------------------------------------

            if window_score > best_score:

                best_score = window_score

                best_window = corridor

        # -----------------------------------------
        # STEP 8: CREATE PLAN
        # -----------------------------------------

        if best_window is not None:

            plan = {
                "task_code": task.get("task_code"),
                "corridor": best_window.get(
                    "corridor"
                ),
                "planned_date": best_window.get(
                    "available_date"
                ),
                "start_time": best_window.get(
                    "start_time"
                ),
                "end_time": best_window.get(
                    "end_time"
                ),
                "priority_score": task.get(
                    "priority_score",
                    0
                ),
                "status": "PLANNED"
            }

            plans.append(plan)

            # Prevent this exact corridor window
            # from being assigned to another task.
            best_window["status"] = "ALLOCATED"

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

    trains = [
        {
            "train_number": "12001",
            "train_name": "Demo Express",
            "corridor": "DELHI-AMBALA",
            "journey_date": "2026-09-20",
            "arrival_time": "11:00",
            "departure_time": "11:30"
        }
    ]

    result = optimize_blocks(
        tasks,
        corridors,
        trains
    )

    print("\n===================================")
    print(" SMART RAIL OPTIMIZATION ENGINE")
    print("===================================\n")

    for plan in result:
        print(plan)
