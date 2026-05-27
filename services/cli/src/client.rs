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
