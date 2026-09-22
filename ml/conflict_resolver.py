from typing import List, Dict


def time_to_minutes(time_string: str) -> int:
    """
    Convert HH:MM time into minutes from midnight.
    """

    hours, minutes = map(
        int,
        time_string.split(":")
    )

    return hours * 60 + minutes


def is_time_conflict(
    block_start: str,
    block_end: str,
    train_arrival: str,
    train_departure: str
) -> bool:
    """
    Check whether a maintenance block overlaps
    with a train movement window.
    """

    block_start_minutes = time_to_minutes(
        block_start
    )

    block_end_minutes = time_to_minutes(
        block_end
    )

    train_start_minutes = time_to_minutes(
        train_arrival
    )

    train_end_minutes = time_to_minutes(
        train_departure
    )

    # Standard interval-overlap check
    return (
        block_start_minutes < train_end_minutes
        and
        block_end_minutes > train_start_minutes
    )


def find_conflicts(
    plans: List[Dict],
    trains: List[Dict]
) -> List[Dict]:
    """
    Check generated plans against train schedules.

    Returns plans that have train conflicts.
    """

    conflicts = []

    for plan in plans:

        for train in trains:

            # Different corridor → no conflict
            if (
                plan.get("corridor")
                != train.get("corridor")
            ):
                continue

            # Different date → no conflict
            if (
                plan.get("planned_date")
                != train.get("journey_date")
            ):
                continue

            conflict = is_time_conflict(
                plan.get("start_time"),
                plan.get("end_time"),
                train.get("arrival_time"),
                train.get("departure_time")
            )

            if conflict:

                conflicts.append({
                    "task_code": plan.get(
                        "task_code"
                    ),
                    "corridor": plan.get(
                        "corridor"
                    ),
                    "planned_date": plan.get(
                        "planned_date"
                    ),
                    "start_time": plan.get(
                        "start_time"
                    ),
                    "end_time": plan.get(
                        "end_time"
                    ),
                    "train_number": train.get(
                        "train_number"
                    ),
                    "train_name": train.get(
                        "train_name"
                    ),
                    "reason": (
                        "Maintenance block overlaps "
                        "with train movement"
                    )
                })

    return conflicts


def remove_conflicting_plans(
    plans: List[Dict],
    trains: List[Dict]
) -> List[Dict]:
    """
    Remove maintenance plans that conflict
    with scheduled train movements.
    """

    safe_plans = []

    for plan in plans:

        has_conflict = False

        for train in trains:

            if (
                plan.get("corridor")
                != train.get("corridor")
            ):
                continue

            if (
                plan.get("planned_date")
                != train.get("journey_date")
            ):
                continue

            if is_time_conflict(
                plan.get("start_time"),
                plan.get("end_time"),
                train.get("arrival_time"),
                train.get("departure_time")
            ):
                has_conflict = True
                break

        if not has_conflict:
            safe_plans.append(plan)

    return safe_plans


if __name__ == "__main__":

    plans = [
        {
            "task_code": "TASK-001",
            "corridor": "DELHI-AMBALA",
            "planned_date": "2026-09-20",
            "start_time": "10:00",
            "end_time": "12:00",
            "priority_score": 90
        },
        {
            "task_code": "TASK-002",
            "corridor": "DELHI-GHAZIABAD",
            "planned_date": "2026-09-21",
            "start_time": "14:00",
            "end_time": "16:00",
            "priority_score": 70
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

    print("Checking conflicts...\n")

    conflicts = find_conflicts(
        plans,
        trains
    )

    print("Conflicts:")

    for conflict in conflicts:
        print(conflict)

    print("\nSafe Plans:")

    safe_plans = remove_conflicting_plans(
        plans,
        trains
    )

    for plan in safe_plans:
        print(plan)