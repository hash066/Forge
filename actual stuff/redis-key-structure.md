# DevForge Redis Cache Keys

## Key Patterns:

risk:{user_id}:{project_id} = JSON of risk scores
  TTL: 3600 seconds (1 hour)
  Example: risk:user_123:project_abc

cost:{user_id}:{project_id} = Monthly cost estimate
  TTL: 3600 seconds (1 hour)
  Example: cost:user_123:project_abc

drift:{user_id}:{project_id} = Drift violations array
  TTL: 1800 seconds (30 minutes)
  Example: drift:user_123:project_abc

skill:{user_id} = Current skill scores
  TTL: 86400 seconds (24 hours)
  Example: skill:user_123

blueprint:{project_id} = Cached blueprint JSON
  TTL: No expiry (manual invalidation)
  Example: blueprint:test-blueprint

analysis:{code_hash} = Code analysis results
  TTL: 3600 seconds (1 hour)
  Example: analysis:a3f8d9e2b1c4

## Usage Example:

# Set risk score
SET risk:user_123:project_abc '{"security":6,"scalability":7}' EX 3600

# Get risk score  
GET risk:user_123:project_abc

# Delete on update
DEL risk:user_123:project_abc