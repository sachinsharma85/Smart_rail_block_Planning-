def calculate_priority(
    urgency: int,
    criticality: int,
    severity: int
) -> float:
    """
    Calculate maintenance priority score.

    Inputs:
        urgency      : 0-10
        criticality  : 0-10
        severity     : 0-10

    Output:
        Priority score: 0-100
    """

    urgency = max(0, min(urgency, 10))
    criticality = max(0, min(criticality, 10))
    severity = max(0, min(severity, 10))

    # Weighted priority calculation
    score = (
        urgency * 0.40 +
        criticality * 0.40 +
        severity * 0.20
    )

    return round(score * 10, 2)


def get_priority_level(score: float) -> str:
    """
    Convert numerical priority score into a priority level.
    """

    if score >= 80:
        return "CRITICAL"

    if score >= 60:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


if __name__ == "__main__":

    urgency = 9
    criticality = 9
    severity = 9

    score = calculate_priority(
        urgency,
        criticality,
        severity
    )

    level = get_priority_level(score)

    print("Priority Score:", score)
    print("Priority Level:", level)