use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct DiagnoseRequest {
    tenant_id: String,
    git_log: String,
    git_diff: String,
    stack_trace: String,
    local_logs: String,
}

#[derive(Deserialize, Debug)]
pub struct DiagnoseResponse {
    pub tenant_id: String,
    pub diagnosis: String,
    pub suggested_fix: Option<String>,
    pub confidence: f64,
}

pub async fn diagnose(
    api_url: &str,
    api_key: &str,
    tenant_id: &str,
    git_log: &str,
    git_diff: &str,
    stack_trace: &str,
) -> Result<DiagnoseResponse, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let request = DiagnoseRequest {
        tenant_id: tenant_id.to_string(),
        git_log: git_log.to_string(),
        git_diff: git_diff.to_string(),
        stack_trace: stack_trace.to_string(),
        local_logs: String::new(),
    };

    let response = client
        .post(&format!("{}/api/v1/diagnose", api_url))
        .header("X-API-Key", api_key)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()).into());
    }

    let diagnosis = response.json::<DiagnoseResponse>().await?;
    Ok(diagnosis)
}

pub async fn health_check(api_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let response = client
        .get(&format!("{}/health", api_url))
        .send()
        .await?;

    if response.status().is_success() {
        Ok("OK".to_string())
    } else {
        Err(format!("HTTP {}", response.status()).into())
    }
}
