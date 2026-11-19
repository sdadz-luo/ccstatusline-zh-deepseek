import { UsagePercentWidget } from './shared/usage-percent-widget';

// Only the opencode go source reports a monthly window (Claude's usage API
// stops at the five-hour/seven-day windows), so this widget renders nothing
// without it.
export class MonthlyUsageWidget extends UsagePercentWidget {
    constructor() {
        super('monthly');
    }
}
