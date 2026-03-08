import json
import boto3
import os

bedrock = boto3.client('bedrock-runtime')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-sonnet-4-20250514-v1:0')

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        code = body.get('code', '')
        language = body.get('language', 'javascript')
        
        if not code:
            return error_response(400, "Code is required")
        
        prompt = f"""Generate a single multiple-choice comprehension question about this {language} code.

CODE:
{code[:500]}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "question": "What does this code do?",
  "options": [
    "Option A description",
    "Option B description", 
    "Option C description",
    "Option D description"
  ],
  "correct_index": 0,
  "explanation": "Explanation of why the correct answer is right",
  "difficulty": "easy|medium|hard"
}}

Make the question test understanding, not memorization."""

        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
                "temperature": 0.7
            })
        )
        
        response_body = json.loads(response['body'].read())
        quiz_text = response_body['content'][0]['text']
        
        # Parse JSON
        try:
            quiz = json.loads(quiz_text)
        except:
            # Strip markdown if present
            quiz_text = quiz_text.replace('```json', '').replace('```', '').strip()
            quiz = json.loads(quiz_text)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(quiz)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, str(e))

def error_response(code, message):
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message})
    }
