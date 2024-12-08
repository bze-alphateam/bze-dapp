//chart periods
export const CHART_4H = '4H';
export const CHART_1D = '1D';
export const CHART_7D = '7D';
export const CHART_30D = '30D';
export const CHART_1Y = '1Y';


// getNoOfIntervalsNeeded - returns the number of intervals needed to build a chart for 1H, 1D, etc
export function getNoOfIntervalsNeeded(chart: string) {
    switch (chart) {
        case CHART_4H:
            return 12 * 4; // 5 minutes intervals
        case CHART_1D:
            return 4 * 24; // 15 minutes intervals
        case CHART_7D:
            return 24 * 7; // 1 hour intervals
        case CHART_30D:
            return 6 * 30; // 4 hours intervals
        case CHART_1Y:
            return 365; // 1 day intervals
        default:
            return 0;
    }
}

export function getChartIntervalsLimit(chart: string) {
    switch (chart) {
        case CHART_4H:
            return (12 * 24) * 7; // 1 week
        case CHART_1D:
            return (4 * 24) * 30; // 2 weeks
        case CHART_7D:
            return 24 * 90; // 3 months
        case CHART_30D:
            return 6 * 365; //  1 year
        case CHART_1Y:
            return 365 * 3; // 3 years
        default:
            return 12;
    }
}

export function getChartMinutes(chart: string) {
    switch (chart) {
        case CHART_4H:
            return 5;
        case CHART_1D:
            return 15;
        case CHART_7D:
            return 60;
        case CHART_30D:
            return 240;
        case CHART_1Y:
            return 1440;
        default:
            return 5;
    }
}
