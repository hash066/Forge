import * as vscode from 'vscode';

export class ArgueMode {
    /**
     * Generates a challenge question when a user makes a significant architectural change.
     */
    public generateChallenge(changeDescription: string): string {
        // Mock challenging logic
        const challenges = [
            `You just added a new service for ${changeDescription}. Why did you choose this technology instead of a more established one?`,
            `How does this change to ${changeDescription} impact the overall system latency and CAP theorem trade-offs?`,
            `Is the added complexity of ${changeDescription} justified by the current performance requirements?`,
            `How will you handle eventual consistency if ${changeDescription} fails mid-transaction?`
        ];
        
        return challenges[Math.floor(Math.random() * challenges.length)];
    }

    public scoreJustification(text: string): { quality: number; critique: string } {
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount < 50) {
            return {
                quality: 2,
                critique: "Your justification is too brief. Architecture decisions require deep reasoning. Please explain the trade-offs in at least 50 words."
            };
        }

        // Mock quality scoring
        if (text.toLowerCase().includes('latency') || text.toLowerCase().includes('scale') || text.toLowerCase().includes('trade-off')) {
            return {
                quality: 8,
                critique: "Great reasoning. You successfully addressed the fundamental architectural trade-offs between performance and complexity."
            };
        }

        return {
            quality: 5,
            critique: "You've explained the 'what', but focus more on the 'why'—specifically the alternatives you rejected and the operational trade-offs."
        };
    }
}
