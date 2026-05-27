use crate::client::DiagnoseResponse;
use colored::Colorize;

pub fn show_diagnosis(diagnosis: &DiagnoseResponse) {
    println!("{}", "═".repeat(80).bright_blue());
    println!("{}", "DIAGNOSIS".bold().bright_cyan());
    println!("{}", "═".repeat(80).bright_blue());

    // Display main diagnosis
    println!("\n{}", diagnosis.diagnosis);

    // Display suggested fix if available
    if let Some(suggested_fix) = &diagnosis.suggested_fix {
        println!("\n{}", "SUGGESTED FIX".bold().bright_green());
        println!("{}", "-".repeat(80));
        println!("{}", suggested_fix);
    }

    // Display confidence
    println!("\n{} {:.0}%", "Confidence:".bright_yellow(), diagnosis.confidence * 100.0);

    println!("\n{}", "═".repeat(80).bright_blue());
}
