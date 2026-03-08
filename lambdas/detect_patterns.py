import json
import re

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        code = body.get('code', '')
        language = body.get('language', 'javascript')
        
        patterns = []
        
        # Detect nested loops (O(n²))
        nested_loop_count = count_nested_loops(code)
        if nested_loop_count >= 2:
            patterns.append({
                'pattern': 'nested_loops',
                'complexity': 'O(n²)' if nested_loop_count == 2 else f'O(n^{nested_loop_count})',
                'severity': 'warning' if nested_loop_count == 2 else 'high',
                'description': f'Detected {nested_loop_count} nested loops',
                'leetcode_problems': [
                    {'title': 'Two Sum', 'difficulty': 'Easy', 'url': 'https://leetcode.com/problems/two-sum/'},
                    {'title': '3Sum', 'difficulty': 'Medium', 'url': 'https://leetcode.com/problems/3sum/'},
                    {'title': 'Container With Most Water', 'difficulty': 'Medium', 'url': 'https://leetcode.com/problems/container-with-most-water/'}
                ],
                'suggestion': 'Consider using HashMap/Set for O(n) or O(n log n) solution'
            })
        
        # Detect sorting
        if has_sorting(code, language):
            patterns.append({
                'pattern': 'sorting',
                'complexity': 'O(n log n)',
                'severity': 'info',
                'description': 'Code uses sorting algorithm',
                'leetcode_problems': [
                    {'title': 'Merge Intervals', 'difficulty': 'Medium', 'url': 'https://leetcode.com/problems/merge-intervals/'},
                    {'title': 'Sort Colors', 'difficulty': 'Medium', 'url': 'https://leetcode.com/problems/sort-colors/'}
                ],
                'suggestion': 'Good use of sorting. Ensure input size justifies O(n log n) complexity'
            })
        
        # Detect recursion
        if has_recursion(code):
            patterns.append({
                'pattern': 'recursion',
                'complexity': 'Varies',
                'severity': 'info',
                'description': 'Recursive function detected',
                'leetcode_problems': [
                    {'title': 'Fibonacci Number', 'difficulty': 'Easy', 'url': 'https://leetcode.com/problems/fibonacci-number/'},
                    {'title': 'Climbing Stairs', 'difficulty': 'Easy', 'url': 'https://leetcode.com/problems/climbing-stairs/'}
                ],
                'suggestion': 'Consider memoization/DP for optimization if experiencing performance issues'
            })
        
        # Detect binary search
        if has_binary_search(code):
            patterns.append({
                'pattern': 'binary_search',
                'complexity': 'O(log n)',
                'severity': 'positive',
                'description': 'Efficient binary search detected',
                'leetcode_problems': [
                    {'title': 'Binary Search', 'difficulty': 'Easy', 'url': 'https://leetcode.com/problems/binary-search/'},
                    {'title': 'Search in Rotated Sorted Array', 'difficulty': 'Medium', 'url': 'https://leetcode.com/problems/search-in-rotated-sorted-array/'}
                ],
                'suggestion': 'Good use of binary search for efficient lookups'
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'patterns': patterns,
                'total_patterns': len(patterns)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def count_nested_loops(code):
    # Count nested for/while loops
    depth = 0
    max_depth = 0
    
    for line in code.split('\n'):
        if 'for' in line or 'while' in line:
            depth += 1
            max_depth = max(max_depth, depth)
        if '}' in line or 'end' in line:
            depth = max(0, depth - 1)
    
    return max_depth

def has_sorting(code, language):
    sort_keywords = ['.sort(', '.sorted(', 'Arrays.sort', 'Collections.sort', 'sorted(']
    return any(keyword in code for keyword in sort_keywords)

def has_recursion(code):
    # Simple heuristic: function calls itself
    function_names = re.findall(r'function\s+(\w+)|def\s+(\w+)|const\s+(\w+)\s*=', code)
    for name_tuple in function_names:
        name = [n for n in name_tuple if n][0] if any(name_tuple) else None
        if name and name in code:
            # Check if function name appears in its own body
            pattern = rf'{name}\s*\('
            matches = len(re.findall(pattern, code))
            if matches > 1:  # Definition + at least one call
                return True
    return False

def has_binary_search(code):
    # Heuristic: looks for mid = (left + right) / 2 pattern
    return 'mid' in code and ('left' in code or 'right' in code) and '/2' in code or '>> 1' in code
