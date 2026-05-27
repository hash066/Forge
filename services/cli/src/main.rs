mod client;
mod context;
mod display;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "devforge")]
#[command(about = "DevForge CLI - Diagnose failures and get AI-powered insights", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Diagnose build/runtime failures
    Wtf {
        /// Stack trace or error message (reads from stdin if not provided)
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        input: Vec<String>,
    },
    /// Check connectivity to the DevForge control plane
    Health,
    /// Show configuration
    Config,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Wtf { input }) => {
            run_wtf(input).await?;
        }
        Some(Commands::Health) => {
            run_health_check().await?;
        }
        Some(Commands::Config) => {
            run_config().await?;
        }
        None => {
            eprintln!("No command specified. Use `devforge --help` for usage.");
        }
    }

    Ok(())
}

async fn run_wtf(input: Vec<String>) -> Result<(), Box<dyn std::error::Error>> {
    let config = context::load_config()?;

    println!("🔍 DevForge WTF - Diagnosing failure...\n");

    // Gather context
    let git_log = context::read_git_log().await?;
    let git_diff = context::read_git_diff().await?;

    let stack_trace = if !input.is_empty() {
        input.join(" ")
    } else {
        context::read_stdin_or_logs().await?
    };

    if git_log.is_empty() && stack_trace.is_empty() {
        eprintln!("❌ No context provided. Please:");
        eprintln!("  1. Run from a git repository, or");
        eprintln!("  2. Pipe a stack trace: `devforge wtf < error.log`");
        return Ok(());
    }

    // Call the API
    let diagnosis = client::diagnose(
        &config.api_url,
        &config.api_key,
        &config.tenant_id,
        &git_log,
        &git_diff,
        &stack_trace,
    )
    .await?;

    // Display results
    display::show_diagnosis(&diagnosis);

    Ok(())
}

async fn run_health_check() -> Result<(), Box<dyn std::error::Error>> {
    let config = context::load_config()?;

    println!("🏥 Checking DevForge control plane health...\n");

    match client::health_check(&config.api_url).await {
        Ok(response) => {
            println!("✅ Control Plane: {}", response);
            println!("   URL: {}", config.api_url);
            println!("   Tenant: {}", config.tenant_id);
        }
        Err(e) => {
            println!("❌ Control Plane unreachable: {}", e);
            println!("   URL: {}", config.api_url);
            println!("   Please ensure the backend is running.");
        }
    }

    Ok(())
}

async fn run_config() -> Result<(), Box<dyn std::error::Error>> {
    let config = context::load_config()?;

    println!("📋 DevForge Configuration\n");
    println!("  Tenant ID: {}", config.tenant_id);
    println!("  API URL:   {}", config.api_url);
    println!("  API Key:   {}", if config.api_key.len() > 8 {
        format!("{}...{}", &config.api_key[..4], &config.api_key[config.api_key.len()-4..])
    } else {
        "****".to_string()
    });
    println!("\nConfig file: {}", context::config_path()?.display());

    Ok(())
}
