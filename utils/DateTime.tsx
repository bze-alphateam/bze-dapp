export function prettyDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'long', year: 'numeric'}).format(date);
}

export function prettyDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

export function hoursUntil(date: Date): number {
    const now = new Date();
    const futureDate = date;

    // Ensure the future date is not in the past
    if (futureDate < now) {
        return 0;
    }

    const millisecondsPerHour = 1000 * 60 * 60;
    const diffInMilliseconds = futureDate.getTime() - now.getTime();
    const hours = diffInMilliseconds / millisecondsPerHour;

    return Math.ceil(hours); // Use Math.ceil to round up to the nearest whole hour
}

export function minutesUntil(date: Date): number {
    const now = new Date();
    const futureDate = date;

    // Check if the future date is in the past
    if (futureDate < now) {
        return 0;
    }

    const millisecondsPerMinute = 1000 * 60; // Number of milliseconds in a minute
    const diffInMilliseconds = futureDate.getTime() - now.getTime();
    const minutes = diffInMilliseconds / millisecondsPerMinute;

    return Math.ceil(minutes); // Use Math.ceil to round up to the nearest whole minute
}
