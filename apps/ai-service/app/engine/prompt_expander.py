"""
Creative Prompt Expander & Visual Director for Social Media Imagery.
Translates user raw imagination into high-converting, platform-optimized visual prompts.
"""

from typing import Dict, Any

PLATFORM_ASPECT_RATIOS = {
    "instagram": "1:1",     # Square feed
    "linkedin": "4:5",      # Portrait feed
    "facebook": "1.91:1",   # Landscape feed
    "threads": "1:1",       # Square
    "x": "16:9",            # Wide banner / card
    "reddit": "16:9"
}

PLATFORM_AESTHETIC_STYLES = {
    "linkedin": (
        "Clean, corporate professional aesthetic, sophisticated modern office or studio setting, "
        "crisp architectural lines, natural daylight, high-end editorial photography, 85mm f/1.8 lens."
    ),
    "x": (
        "High-contrast, bold tech-forward aesthetic, dynamic angles, vibrant subtle neon or twilight rim lighting, "
        "minimalist modern composition, engaging visual focal point."
    ),
    "instagram": (
        "Artistic visual storytelling, rich color grading, warm ambient lighting, filmic depth of field, "
        "aesthetic lifestyle composition, hyper-detailed texture."
    ),
    "facebook": (
        "Warm, approachable, community-oriented, soft natural sunlight, relatable and authentic human atmosphere."
    ),
    "threads": (
        "Candid, unposed, editorial street or workspace vibe, subtle grain, modern contemporary look."
    ),
    "reddit": (
        "Authentic, grounded, non-commercial candid photograph, genuine environment, natural uncurated lighting."
    )
}

def expand_visual_prompt(user_intent: str, platform: str = "instagram", style: str = "photographic") -> Dict[str, Any]:
    """
    Expands raw user imagination into a production-grade image prompt tailored for social engagement.
    """
    target_platform = platform.lower()
    aspect_ratio = PLATFORM_ASPECT_RATIOS.get(target_platform, "1:1")
    aesthetic = PLATFORM_AESTHETIC_STYLES.get(target_platform, PLATFORM_AESTHETIC_STYLES["instagram"])

    # Build master cleared visual prompt
    expanded_prompt = (
        f"Masterpiece commercial photograph: {user_intent.strip()}. "
        f"Visual style & atmosphere: {aesthetic} "
        f"Lighting & details: Volumetric lighting, sharp focus on central subject, 8k resolution, photorealistic textures. "
        f"Negative constraints: No distorted anatomy, no warped text, no blurry watermarks, no low quality renders."
    )

    return {
        "original_intent": user_intent,
        "expanded_prompt": expanded_prompt,
        "aspect_ratio": aspect_ratio,
        "platform": target_platform,
        "style": style
    }
