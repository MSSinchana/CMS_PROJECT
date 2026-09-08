def calculate_green_score(findings: list, benchmark: dict | None = None) -> tuple[int, str]:
    severity_penalty = {"low": 4, "medium": 8, "high": 14}
    score = 100
    for finding in findings:
        score -= severity_penalty.get(finding.severity, 5)

    rationale = ["Base score 100 minus penalties from findings."]
    if benchmark:
        original = benchmark["original_time_ms"]
        optimized = benchmark["optimized_time_ms"]
        if original > 0:
            improvement_pct = ((original - optimized) / original) * 100
            if improvement_pct > 0:
                bonus = min(25, int(improvement_pct // 2))
                score += bonus
                rationale.append(f"Benchmark bonus +{bonus} for {improvement_pct:.1f}% time reduction.")
            else:
                rationale.append("No benchmark improvement bonus applied.")

    bounded = max(0, min(100, int(score)))
    rationale.append(f"Final bounded score: {bounded}.")
    return bounded, " ".join(rationale)
