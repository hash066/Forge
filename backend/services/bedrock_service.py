import boto3
from backend.config import settings


class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region
        )
        self.model_id = settings.anthropic_model_id

    async def analyze_code(self, code: str, language: str = "typescript") -> dict:
        """Use Bedrock to analyze code and return risk scores"""
        prompt = f"""Analyze the following {language} code for architectural risks.

Code:
{code}

Provide risk scores (1-10) for: security, scalability, overengineering, cost.
Also provide a list of feedback items and violations found.

Return as JSON with keys: security, scalability, overengineering, cost, feedback (list), violations (list)"""

        response = self.client.invoke_model(
            modelId=self.model_id,
            body=self._format_request(prompt),
            contentType="application/json",
            accept="application/json"
        )
        return self._parse_response(response)

    async def diagnose_failure(self, git_log: str, git_diff: str, stack_trace: str = None, logs: str = None) -> dict:
        """Use Bedrock to diagnose build/runtime failures"""
        context_parts = [
            f"Git history:\n{git_log}",
            f"Uncommitted changes:\n{git_diff}"
        ]
        if stack_trace:
            context_parts.append(f"Stack trace:\n{stack_trace}")
        if logs:
            context_parts.append(f"Logs:\n{logs}")

        prompt = f"""Diagnose why this development workflow is failing.

{chr(10).join(context_parts)}

Provide:
1. Root cause diagnosis
2. Suggested fix (specific commands or code changes)
3. Confidence level (0.0-1.0)

Return as JSON with keys: diagnosis, suggested_fix, confidence"""

        response = self.client.invoke_model(
            modelId=self.model_id,
            body=self._format_request(prompt),
            contentType="application/json",
            accept="application/json"
        )
        return self._parse_response(response)

    def _format_request(self, prompt: str) -> str:
        import json
        return json.dumps({
            "anthropic_version": "bedrock-2023-06-01",
            "max_tokens": 2048,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })

    def _parse_response(self, response) -> dict:
        import json
        response_body = json.loads(response["body"].read())
        # Extract text from Bedrock response
        text_content = response_body["content"][0]["text"]

        # Try to extract JSON from response
        try:
            # Find JSON in response
            start_idx = text_content.find("{")
            end_idx = text_content.rfind("}") + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = text_content[start_idx:end_idx]
                return json.loads(json_str)
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: return raw response
        return {"raw_response": text_content}
