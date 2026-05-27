use crate::client::DiagnoseResponse;
use colored::Colorize;

const RULE: &str = "─";

pub fn show_diagnosis(diagnosis: &DiagnoseResponse) {
    let bar = RULE.repeat(80).bright_blue().to_string();

    println!("\n{}", bar);
    println!("  {}", "DEVFORGE  ·  diagnosis".bold().bright_cyan());
    println!("{}\n", bar);

    println!("{}", "What happened".bold().bright_yellow());
    println!("  {}\n", diagnosis.diagnosis);

    println!("{}", "Root cause".bold().bright_yellow());
    println!("  {}\n", diagnosis.root_cause);

    if !diagnosis.suggested_fix.is_empty() {
        println!("{}", "Suggested fix".bold().bright_green());
        for line in diagnosis.suggested_fix.lines() {
            println!("  {}", line);
        }
        println!();
    }

    if !diagnosis.commands.is_empty() {
        println!("{}", "Commands to run".bold().bright_green());
        for cmd in &diagnosis.commands {
            println!("  {} {}", "$".dimmed(), cmd.bright_white());
        }
        println!();
    }

    let confidence_label = match diagnosis.confidence {
        c if c >= 0.8 => "High".bright_green(),
        c if c >= 0.5 => "Medium".bright_yellow(),
        _ => "Low".bright_red(),
    };
    println!(
        "{} {} ({:.0}%)",
        "Confidence:".dimmed(),
        confidence_label,
        diagnosis.confidence * 100.0
    );
    println!("{}", bar);
}
