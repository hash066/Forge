mod client;
mod context;
mod display;

use clap::{Parser, Subcommand};
use colored::Colorize;

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
    /// Inspect the live Kubernetes cluster (DevForge OS)
    Cluster {
        #[command(subcommand)]
        action: ClusterAction,
    },
}

#[derive(Subcommand)]
enum ClusterAction {
    /// Show cluster health, cost, and active incidents
    Status,
    /// Continuously watch cluster health + incidents
    Watch {
        /// Refresh interval in seconds
        #[arg(long, default_value = "5")]
        interval: u64,
    },
    /// List recent incidents and their AI remediations
    Incidents {
        #[arg(long, default_value = "20")]
        limit: u32,
    },
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
        Some(Commands::Cluster { action }) => {
            run_cluster(action).await?;
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

async fn run_cluster(action: ClusterAction) -> Result<(), Box<dyn std::error::Error>> {
    match action {
        ClusterAction::Status => cluster_status().await,
        ClusterAction::Watch { interval } => cluster_watch(interval).await,
        ClusterAction::Incidents { limit } => cluster_incidents(limit).await,
    }
}

fn health_colored(score: f64) -> colored::ColoredString {
    let s = format!("{:.0}%", score);
    if score >= 90.0 {
        s.green().bold()
    } else if score >= 70.0 {
        s.yellow().bold()
    } else {
        s.red().bold()
    }
}

fn severity_colored(sev: &str) -> colored::ColoredString {
    match sev {
        "critical" => sev.red().bold(),
        "high" => sev.truecolor(255, 140, 60),
        "medium" => sev.yellow(),
        "low" => sev.blue(),
        _ => sev.normal(),
    }
}

async fn cluster_status() -> Result<(), Box<dyn std::error::Error>> {
    let config = context::load_config()?;
    let ov =
        client::cluster_overview(&config.api_url, &config.api_key, &config.tenant_id).await?;

    println!("{}", "🛰  DevForge OS — Cluster Status".bold());
    if let Some(s) = &ov.snapshot {
        println!(
            "   Health:   {}  ({}/{} pods healthy)",
            health_colored(s.health_score),
            s.pods_healthy,
            s.pods_total
        );
        println!(
            "   Cost:     ${:.0}/mo   (${:.0} waste detected)",
            s.monthly_cost_usd, s.monthly_waste_usd
        );
        println!("   Security: {} findings", s.security_findings);
    }
    println!(
        "   Incidents: {} total · {} open · {} resolved",
        ov.stats.total,
        ov.stats.open.to_string().yellow(),
        ov.stats.resolved.to_string().green()
    );

    let open: Vec<_> = ov
        .recent_incidents
        .iter()
        .filter(|i| i.status != "resolved")
        .collect();
    if open.is_empty() {
        println!("\n   {}", "✓ No active incidents — cluster healthy.".green());
    } else {
        println!("\n   {}", "Active incidents:".bold());
        for i in open.iter().take(10) {
            println!(
                "   {} [{}] {}/{}  → {} ({})",
                "●".red(),
                severity_colored(&i.severity),
                i.namespace,
                i.name,
                i.remediation.action.cyan(),
                i.status
            );
        }
    }
    Ok(())
}

async fn cluster_incidents(limit: u32) -> Result<(), Box<dyn std::error::Error>> {
    let config = context::load_config()?;
    let incidents =
        client::list_incidents(&config.api_url, &config.api_key, &config.tenant_id, limit).await?;

    if incidents.is_empty() {
        println!("{}", "No incidents recorded.".green());
        return Ok(());
    }
    for i in &incidents {
        println!(
            "\n{} [{}] {}/{}",
            i.reason.bold(),
            severity_colored(&i.severity),
            i.namespace,
            i.name
        );
        println!("   status:     {}", i.status);
        println!("   summary:    {}", i.summary);
        println!("   root cause: {}", i.root_cause.dimmed());
        println!(
            "   fix:        {} → {} ({} risk, {:.0}% confidence)",
            i.remediation.action.cyan(),
            i.remediation.target,
            i.remediation.risk,
            i.confidence * 100.0
        );
        if let Some(cmd) = i.remediation.commands.first() {
            println!("   $ {}", cmd.green());
        }
    }
    Ok(())
}

async fn cluster_watch(interval: u64) -> Result<(), Box<dyn std::error::Error>> {
    println!("Watching cluster every {}s (Ctrl+C to stop)…\n", interval);
    loop {
        // Clear screen + home cursor
        print!("\x1B[2J\x1B[H");
        if let Err(e) = cluster_status().await {
            eprintln!("{} {}", "⚠".yellow(), e);
        }
        tokio::time::sleep(std::time::Duration::from_secs(interval)).await;
    }
}
