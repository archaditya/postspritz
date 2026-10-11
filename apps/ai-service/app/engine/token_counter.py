"""
Token Consumption & Cost Accounting Engine.
Computes token volume and estimated USD pricing for transparent user and system observability.
"""

from typing import Dict, Any

# Cost rates per 1,000,000 tokens (USD)
MODEL_PRICING = {
    "gemini-2.0-flash": {
        "input_per_m": 0.075,
        "output_per_m": 0.300
    },
    "gpt-4o-mini": {
        "input_per_m": 0.150,
        "output_per_m": 0.600
    },
    "imagen-3": {
        "per_image": 0.040
    },
    "dall-e-3": {
        "per_image": 0.040
    }
}

def estimate_text_tokens(text: str) -> int:
    """Rough estimation ~4 characters per token for English text."""
    if not text:
        return 0
    return max(1, len(text) // 4)

def calculate_text_cost(prompt: str, completion: str, model: str = "gemini-2.0-flash") -> Dict[str, Any]:
    input_tokens = estimate_text_tokens(prompt)
    output_tokens = estimate_text_tokens(completion)
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["gemini-2.0-flash"])

    cost_usd = (input_tokens / 1_000_000 * pricing["input_per_m"]) + (output_tokens / 1_000_000 * pricing["output_per_m"])

    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "estimated_cost_usd": round(cost_usd, 6),
        "model": model
    }

def calculate_image_cost(image_count: int, model: str = "imagen-3") -> Dict[str, Any]:
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["imagen-3"])
    cost_usd = image_count * pricing.get("per_image", 0.04)

    return {
        "image_units": image_count,
        "estimated_cost_usd": round(cost_usd, 4),
        "model": model
    }
