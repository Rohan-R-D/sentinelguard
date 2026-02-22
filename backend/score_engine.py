from typing import Any, Dict


PENALTIES = {
    "CRITICAL": 40,
    "HIGH": 25,
    "MEDIUM": 10,
    "LOW": 2,
}


def calculate_score(report: Dict[str, Any], verified: bool) -> int:
    score = 100

    detectors = []
    if isinstance(report, dict):
        results = report.get("results") or {}
        detectors = results.get("detectors") or []

    for detector in detectors:
        impact = (detector.get("impact") or detector.get("severity") or "").upper()
        penalty = PENALTIES.get(impact)
        if penalty:
            score -= penalty

    if score < 0:
        score = 0

    if not verified:
        score = min(score, 30)

    return score


def risk_level_from_score(score: int) -> str:
    if score >= 80:
        return "Safe"
    if score >= 50:
        return "Moderate"
    return "High Risk"

