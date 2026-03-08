interface ServicePricing {
    type: string;
    monthlyBasePrice: number;
    unitPriceLabel: string;
    unitPrice: number;
}

export class CostCalculator {
    private mockPricing: Record<string, ServicePricing> = {
        'aws:s3': {
            type: 'aws:s3',
            monthlyBasePrice: 5.0,
            unitPriceLabel: 'GB-mo',
            unitPrice: 0.023
        },
        'aws:dynamodb': {
            type: 'aws:dynamodb',
            monthlyBasePrice: 15.0,
            unitPriceLabel: 'WCU/RCU',
            unitPrice: 0.25
        },
        'aws:lambda': {
            type: 'aws:lambda',
            monthlyBasePrice: 0.2, // $0.20 per 1M requests
            unitPriceLabel: 'M requests',
            unitPrice: 0.2
        },
        'aws:rds': {
            type: 'aws:rds',
            monthlyBasePrice: 45.0, // t3.micro approx
            unitPriceLabel: 'Instance',
            unitPrice: 45.0
        },
        'aws:elasticache': {
            type: 'aws:elasticache',
            monthlyBasePrice: 32.0, // t3.micro approx
            unitPriceLabel: 'Instance',
            unitPrice: 32.0
        }
    };

    /**
     * Calculates total monthly cost for an array of detected services.
     */
    public calculateMonthlyCost(services: any[]): number {
        let total = 0;

        services.forEach(service => {
            const pricing = this.mockPricing[service.type];
            if (pricing) {
                total += pricing.monthlyBasePrice;
                if (service.instances && service.instances > 1) {
                    total += pricing.unitPrice * (service.instances - 1);
                }
            }
        });

        return parseFloat(total.toFixed(2));
    }

    public formatCost(amount: number): string {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`;
    }

    public compareToBudget(cost: number, budget: number): { exceeded: boolean; diff: number; percent: number } {
        const diff = cost - budget;
        const percent = budget > 0 ? (cost / budget) * 100 : 0;
        return {
            exceeded: cost > budget,
            diff,
            percent
        };
    }
}
