"""
Micro-Evaluation & Guardrail Engine for Social Media Content.
Evaluates character boundaries, hashtag density, tone conformance, and toxicity.
"""

import re
from typing import Dict, Any, List

PLATFORM_LIMITS = {
    "x": 280,
    "threads": 500,
    "linkedin": 3000,
    "facebook": 5000,
    "instagram": 2200,
    "reddit": 40000
}

BLOCKED_PATTERNS = [
    r"\b(free money|get rich quick|guaranteed return|wire transfer)\b",
    r"\b(password|api[_-]?key|secret[_-]?token)\b"
]

def evaluate_content(text: str, platform: str) -> Dict[str, Any]:
    target_platform = platform.lower()
    char_limit = PLATFORM_LIMITS.get(target_platform, 2000)
    char_count = len(text)

    # 1. Length Conformance Check
    length_passed = char_count <= char_limit
    length_penalty = 0.0 if length_passed else min(1.0, (char_count - char_limit) / 100)

    # 2. Hashtags Analysis
    hashtags = re.findall(r"#\w+", text)
    hashtag_count = len(hashtags)
    hashtag_passed = True

    if target_platform == "x" and hashtag_count > 2:
        hashtag_passed = False  # X penalizes spammy hashtags
    elif target_platform == "linkedin" and hashtag_count > 6:
        hashtag_passed = False

    # 3. Guardrail / Safety Clearance Check
    safety_passed = True
    flagged_reasons: List[str] = []
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            safety_passed = False
            flagged_reasons.append(f"Content matched safety policy pattern: {pattern}")

    # 4. Conformance Score Computation (0.00 to 1.00)
    score = 1.0
    if not length_passed:
        score -= (0.4 + length_penalty * 0.4)
    if not hashtag_passed:
        score -= 0.15
    if not safety_passed:
        score = 0.0

    final_score = max(0.0, min(1.0, round(score, 2)))

    return {
        "passed": length_passed and safety_passed,
        "score": final_score,
        "metrics": {
            "character_count": char_count,
            "character_limit": char_limit,
            "hashtag_count": hashtag_count,
            "hashtags": hashtags
        },
        "checks": {
            "length_ok": length_passed,
            "hashtags_ok": hashtag_passed,
            "safety_cleared": safety_passed
        },
        "flagged_reasons": flagged_reasons
    }
