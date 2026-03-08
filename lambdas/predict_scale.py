import json
from datetime import datetime

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        architecture = body.get('architecture', {})
        current_users = body.get('current_users', 1000)
        
        timeline = []
        
        # Analyze database capacity
        db_config = architecture.get('database', {})
        db_type = db_config.get('type', 'rds')
        instance_class = db_config.get('instance_class', 'db.t3.micro')
        
        db_capacity = calculate_db_capacity(instance_class)
        
        timeline.append({
            'user_count': current_users,
            'status': 'healthy',
            'health_score': 100,
            'issues': []
        })
        
        if current_users < db_capacity * 0.5:
            timeline.append({
                'user_count': db_capacity * 0.5,
                'status': 'healthy',
                'health_score': 90,
                'issues': []
            })
        
        timeline.append({
            'user_count': db_capacity * 0.8,
            'status': 'degraded',
            'health_score': 60,
            'issues': [{
                'component': 'database',
                'severity': 'warning',
                'description': 'Database connection pool at 80% capacity',
                'recommendation': 'Consider adding read replicas'
            }]
        })
        
        timeline.append({
            'user_count': db_capacity,
            'status': 'critical',
            'health_score': 20,
            'issues': [{
                'component': 'database',
                'severity': 'critical',
                'description': 'Database connection pool exhausted',
                'recommendation': 'Immediate action: Add read replicas or increase connection limit',
                'estimated_cost': '+$50/month for read replica'
            }]
        })
        
        # Analyze compute capacity
        compute = architecture.get('compute', {})
        instance_type = compute.get('instance_type', 't3.micro')
        
        compute_capacity = calculate_compute_capacity(instance_type)
        
        timeline.append({
            'user_count': compute_capacity,
            'status': 'failure',
            'health_score': 0,
            'issues': [{
                'component': 'compute',
                'severity': 'critical',
                'description': 'CPU saturation at 100%, system unresponsive',
                'recommendation': 'Scale to larger instance or enable auto-scaling',
                'estimated_cost': '+$30/month for t3.medium'
            }]
        })
        
        # Sort timeline
        timeline = sorted(timeline, key=lambda x: x['user_count'])
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'current_users': current_users,
                'timeline': timeline,
                'summary': generate_summary(timeline),
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def calculate_db_capacity(instance_class):
    # Max connections capacity map
    capacity = {
        'db.t3.micro': 1000,
        'db.t3.small': 5000,
        'db.t3.medium': 10000,
        'db.t3.large': 25000,
        'db.m5.large': 50000
    }
    return capacity.get(instance_class, 1000)

def calculate_compute_capacity(instance_type):
    # Concurrent user capacity map
    capacity = {
        't3.micro': 500,
        't3.small': 2000,
        't3.medium': 5000,
        't3.large': 10000,
        't3.xlarge': 25000
    }
    return capacity.get(instance_type, 500)

def generate_summary(timeline):
    failure_points = [t for t in timeline if t['status'] in ['critical', 'failure']]
    
    if failure_points:
        first_failure = failure_points[0]
        return {
            'first_failure_at': first_failure['user_count'],
            'failure_component': first_failure['issues'][0]['component'] if first_failure['issues'] else 'unknown',
            'action_required': True,
            'recommendation': first_failure['issues'][0]['recommendation'] if first_failure['issues'] else ''
        }
    
    return {
        'first_failure_at': None,
        'action_required': False,
        'status': 'System appears stable at current scale'
    }
