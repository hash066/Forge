use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub tenant_id: String,
    pub api_url: String,
    pub api_key: String,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            tenant_id: "local-dev".to_string(),
            api_url: "http://localhost:8000".to_string(),
            api_key: "dev-local-key".to_string(),
        }
    }
}

pub fn config_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let home = home::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join(".devforge").join("config.toml"))
}

pub fn load_config() -> Result<Config, Box<dyn std::error::Error>> {
    let path = config_path()?;

    if path.exists() {
        let content = std::fs::read_to_string(&path)?;
        let config = toml::from_str(&content)?;
        Ok(config)
    } else {
        // Return default config
        Ok(Config::default())
    }
}

pub async fn read_git_log() -> Result<String, Box<dyn std::error::Error>> {
    let output = Command::new("git")
        .args(&["log", "--oneline", "-20"])
        .output()?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub async fn read_git_diff() -> Result<String, Box<dyn std::error::Error>> {
    let output = Command::new("git")
        .args(&["diff", "HEAD"])
        .output()?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub async fn read_stdin_or_logs() -> Result<String, Box<dyn std::error::Error>> {
    use std::io::Read;

    let mut buffer = String::new();
    std::io::stdin().read_to_string(&mut buffer)?;

    Ok(buffer)
}
