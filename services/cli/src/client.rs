// HTTP client for the DevForge control plane.
//
// CLI surface area is small: today we call /v1/diagnose and /health. Phase 1
// adds /v1/auth/session (after `devforge login`) and /v1/analysis for
// `devforge analyze`.
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Serialize)]
struct DiagnoseRequest {
    git_log: String,
    git_diff: String,
    stack_trace: Option<String>,
    logs: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct DiagnoseMetadata {
    pub request_id: String,
    pub tenant_id: String,
    #[allow(dead_code)]
    pub latency_ms: f64,
}

#[derive(Deserialize, Debug)]
pub struct DiagnoseResponse {
    pub diagnosis: String,
    pub root_cause: String,
    pub suggested_fix: String,
    #[serde(default)]
    pub commands: Vec<String>,
    pub confidence: f64,
    #[allow(dead_code)]
    pub metadata: DiagnoseMetadata,
}

fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(45))
        .user_agent(concat!("devforge-cli/", env!("CARGO_PKG_VERSION")))
        .build()
        .expect("reqwest client builds")
}

pub async fn diagnose(
    api_url: &str,
    api_key: &str,
    tenant_id: &str,
    git_log: &str,
    git_diff: &str,
    stack_trace: &str,
) -> Result<DiagnoseResponse, Box<dyn std::error::Error>> {
    let client = http_client();

    let request = DiagnoseRequest {
        git_log: git_log.to_string(),
        git_diff: git_diff.to_string(),
        stack_trace: if stack_trace.is_empty() {
            None
        } else {
            Some(stack_trace.to_string())
        },
        logs: None,
    };

    let response = client
        .post(format!("{}/v1/diagnose", api_url.trim_end_matches('/')))
        .header("X-API-Key", api_key)
        .header("X-Tenant-Id", tenant_id)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, body).into());
    }

    let diagnosis = response.json::<DiagnoseResponse>().await?;
    Ok(diagnosis)
}

// ── Kubernetes (DevForge OS) ─────────────────────────────────────────────────
#[derive(Deserialize, Debug, Default)]
pub struct IncidentStats {
    #[serde(default)]
    pub total: i64,
    #[serde(default)]
    pub open: i64,
    #[serde(default)]
    pub resolved: i64,
    #[serde(default)]
    pub suggested: i64,
    #[serde(default)]
    pub remediating: i64,
}

#[derive(Deserialize, Debug, Default)]
pub struct ClusterSnapshot {
    #[serde(default)]
    pub health_score: f64,
    #[serde(default)]
    pub pods_total: i64,
    #[serde(default)]
    pub pods_healthy: i64,
    #[serde(default)]
    pub monthly_cost_usd: f64,
    #[serde(default)]
    pub monthly_waste_usd: f64,
    #[serde(default)]
    pub security_findings: i64,
}

#[derive(Deserialize, Debug, Default)]
pub struct Remediation {
    #[serde(default)]
    pub action: String,
    #[serde(default)]
    pub target: String,
    #[serde(default)]
    pub risk: String,
    #[serde(default)]
    pub commands: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Incident {
    pub namespace: String,
    pub name: String,
    pub reason: String,
    pub severity: String,
    pub status: String,
    pub summary: String,
    pub root_cause: String,
    #[serde(default)]
    pub confidence: f64,
    #[serde(default)]
    pub remediation: Remediation,
}

#[derive(Deserialize, Debug)]
pub struct Overview {
    pub stats: IncidentStats,
    pub snapshot: Option<ClusterSnapshot>,
    #[serde(default)]
    pub recent_incidents: Vec<Incident>,
}

async fn get_json<T: for<'de> Deserialize<'de>>(
    api_url: &str,
    api_key: &str,
    tenant_id: &str,
    path: &str,
) -> Result<T, Box<dyn std::error::Error>> {
    let client = http_client();
    let response = client
        .get(format!("{}{}", api_url.trim_end_matches('/'), path))
        .header("X-API-Key", api_key)
        .header("X-Tenant-Id", tenant_id)
        .send()
        .await?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, body).into());
    }
    Ok(response.json::<T>().await?)
}

pub async fn cluster_overview(
    api_url: &str,
    api_key: &str,
    tenant_id: &str,
) -> Result<Overview, Box<dyn std::error::Error>> {
    get_json(api_url, api_key, tenant_id, "/v1/k8s/overview").await
}

pub async fn list_incidents(
    api_url: &str,
    api_key: &str,
    tenant_id: &str,
    limit: u32,
) -> Result<Vec<Incident>, Box<dyn std::error::Error>> {
    get_json(
        api_url,
        api_key,
        tenant_id,
        &format!("/v1/k8s/incidents?limit={}", limit),
    )
    .await
}

pub async fn health_check(api_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = http_client();
    let response = client
        .get(format!("{}/health", api_url.trim_end_matches('/')))
        .send()
        .await?;

    if response.status().is_success() {
        Ok("OK".to_string())
    } else {
        Err(format!("HTTP {}", response.status()).into())
    }
}
