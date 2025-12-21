type LogData = Record<string, unknown>;

function formatMessage(namespace: string, action: string, data?: LogData): string {
    const prefix = `[${namespace}] ${action}`;
    if (!data || Object.keys(data).length === 0) {
        return prefix;
    }
    return `${prefix} ${JSON.stringify(data)}`;
}

export function createLogger(namespace: string) {
    return {
        info(action: string, data?: LogData) {
            console.log(formatMessage(namespace, action, data));
        },
        warn(action: string, data?: LogData) {
            console.warn(formatMessage(namespace, action, data));
        },
        error(action: string, error: unknown, data?: LogData) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(formatMessage(namespace, action, { ...data, error: errorMessage }));
        },
    };
}
