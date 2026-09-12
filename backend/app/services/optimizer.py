import textwrap
import json

import httpx

from ..config import get_settings


RULE_BASED_GUIDANCE = textwrap.dedent(
    """
    Rule-based optimization guidance:
    1. Move repeated calculations outside loops where values do not change.
    2. Replace string concatenation in loops with list append + ''.join().
    3. Avoid repeated DB/API calls inside loops; batch requests.
    4. If sorting is used, verify the sorted order is necessary.
    5. Minimize temporary object creation in hot loops.
    """
).strip()


def build_prompt(code: str, findings: list[dict]) -> str:
    findings_text = "\n".join(
        f"- [{f['severity']}/{f['certainty']}] {f['category']}: {f['message']}" for f in findings
    )
    return (
        "You are optimizing Python code for performance and sustainability. "
        "Return JSON with keys 'explanation' and 'optimized_code'.\n"
        f"Findings:\n{findings_text}\n\nOriginal code:\n{code}"
    )


async def generate_optimization(code: str, findings: list[dict]) -> tuple[str, str, str]:
    settings = get_settings()
    if not settings.llm_api_url or not settings.llm_api_key:
        explanation = (
            "AI API key is not configured, so rule-based recommendations are provided. "
            + RULE_BASED_GUIDANCE
        )
        return explanation, code, "rules"

    headers = {
        "Authorization": f"******",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.llm_model or "default",
        "messages": [{"role": "user", "content": build_prompt(code, findings)}],
        "temperature": 0.2,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(settings.llm_api_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content:
                raise ValueError("Empty LLM response")
            try:
                parsed = json.loads(content)
                explanation = parsed.get("explanation", "AI optimization generated.")
                optimized = parsed.get("optimized_code", code)
                return explanation, optimized, "ai"
            except Exception:
                return "AI optimization generated.", content, "ai"
    except Exception:
        explanation = (
            "AI optimization request failed, so rule-based recommendations are provided. "
            + RULE_BASED_GUIDANCE
        )
        return explanation, code, "rules"
