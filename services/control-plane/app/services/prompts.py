"""
Prompt registry.

Prompts are first-class assets — versioned, reviewable, and separable from the
transport layer. In Phase 1+ we move them to `prompts/*.md` files loaded at
startup so prompt engineers can iterate without touching Python.

For now they live inline for simplicity. Each function returns a complete
prompt ready to send to Bedrock.
"""

from __future__ import annotations

import textwrap

# Shared system prompt — sets the AI's tone across every endpoint.
SYSTEM_PROMPT = textwrap.dedent(
    """
    You are DevForge, an expert software architect and code reviewer. You analyse
    code from the perspective of a principal engineer: pragmatic, technically
    rigorous, allergic to over-engineering, and protective of production stability.

    Always respond with strict, parseable JSON matching the requested schema.
    Never wrap output in prose explanation outside the JSON.
    """,
).strip()


def analyse_code(code: str, language: str, blueprint_summary: str | None = None) -> str:
    blueprint_block = f"\nApproved blueprint summary:\n{blueprint_summary}\n" if blueprint_summary else ""
    return textwrap.dedent(
        f"""
        Analyse the following {language} code for architectural, security, and
        scalability issues. {blueprint_block}

        Code:
        ```{language}
        {code}
        ```

        Return JSON with this exact shape:
        {{
          "summary": "one-sentence overview",
          "severity": "info|low|medium|high|critical",
          "violations": [
            {{
              "severity": "info|low|medium|high|critical",
              "category": "security|drift|cost|scalability|maintainability",
              "title": "...",
              "description": "...",
              "file": null,
              "line_start": null,
              "line_end": null,
              "recommendation": "...",
              "auto_fix_available": false
            }}
          ],
          "risk_scores": {{
            "scalability": 0,
            "over_engineering": 0,
            "security": 0,
            "consistency": 0
          }},
          "recommendations": ["..."]
        }}
        """,
    ).strip()


def detect_drift(blueprint: dict, actual_code: str) -> str:
    return textwrap.dedent(
        f"""
        Compare the implementation against the approved architectural blueprint.
        Flag any deviation — wrong technology, missing components, unauthorised
        dependencies, layer boundary violations.

        Blueprint:
        {blueprint}

        Implementation:
        ```
        {actual_code}
        ```

        Return JSON:
        {{
          "drift_detected": true|false,
          "drift_score": 0..100,
          "items": [
            {{
              "resource_id": "...",
              "drift_type": "missing|unmanaged|modified_property|wrong_technology",
              "severity": "info|low|medium|high|critical",
              "expected": "...",
              "actual": "...",
              "description": "...",
              "recommendation": "..."
            }}
          ]
        }}
        """,
    ).strip()


def calculate_risk(architecture: dict, context: dict | None = None) -> str:
    ctx_block = f"\nProject context:\n{context}\n" if context else ""
    return textwrap.dedent(
        f"""
        Score this architecture along four dimensions on a 0–100 scale where
        100 is excellent.{ctx_block}

        Architecture:
        {architecture}

        Return JSON:
        {{
          "scores": {{
            "scalability": 0,
            "over_engineering": 0,
            "security": 0,
            "consistency": 0
          }},
          "rationale": {{
            "scalability": "...",
            "over_engineering": "...",
            "security": "...",
            "consistency": "..."
          }}
        }}
        """,
    ).strip()


def mentor_chat(question: str, mode: str, context: dict | None = None) -> str:
    persona = (
        "You are in STUDENT MODE — patient, Socratic, explaining concepts with examples."
        if mode == "student"
        else "You are in DEVELOPER MODE — direct, technical, no hand-holding."
    )
    ctx_block = f"\nCurrent code context:\n{context}\n" if context else ""
    return textwrap.dedent(
        f"""
        {persona}{ctx_block}

        Developer asked: {question}

        Respond in plain prose (no JSON for this endpoint). Keep it focused.
        """,
    ).strip()


def generate_quiz(code: str, language: str) -> str:
    return textwrap.dedent(
        f"""
        Generate a single multiple-choice comprehension question about this
        {language} code. The question should test whether the reader UNDERSTANDS
        why the code is structured the way it is, not just what it does.

        Code:
        ```{language}
        {code}
        ```

        Return JSON:
        {{
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "correct_index": 0,
          "explanation": "...",
          "difficulty": "easy|medium|hard",
          "skill_dimension": "security|error_handling|system_design|performance|decoupling|inclusion"
        }}
        """,
    ).strip()


def diagnose_failure(
    git_log: str,
    git_diff: str,
    stack_trace: str | None,
    logs: str | None,
) -> str:
    blocks = [f"Git log:\n{git_log}", f"Git diff:\n{git_diff}"]
    if stack_trace:
        blocks.append(f"Stack trace:\n{stack_trace}")
    if logs:
        blocks.append(f"Logs:\n{logs}")
    return textwrap.dedent(
        """
        Diagnose why this build/runtime is failing. Identify the root cause and
        propose a specific fix (commands, code edit, or config change).

        Context:
        """,
    ).strip() + "\n\n" + "\n\n".join(blocks) + textwrap.dedent(
        """

        Return JSON:
        {
          "diagnosis": "...",
          "root_cause": "...",
          "suggested_fix": "...",
          "commands": ["..."],
          "confidence": 0.0
        }
        """,
    )
