export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRecord(value: unknown): UnknownRecord {
    return isRecord(value) ? value : {};
}

export function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

export function asNonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
}

export function asRecordArray(value: unknown): UnknownRecord[] {
    return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function asUnknownArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

export function getString(record: UnknownRecord, key: string): string | undefined {
    return asString(record[key]);
}

export function getNonEmptyString(record: UnknownRecord, key: string): string | undefined {
    return asNonEmptyString(record[key]);
}

export function getStringOrNumber(record: UnknownRecord, key: string): string | number | undefined {
    const value = record[key];
    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

export function getRecord(record: UnknownRecord, key: string): UnknownRecord | undefined {
    const value = record[key];
    return isRecord(value) ? value : undefined;
}

export function getStringArray(record: UnknownRecord, key: string): string[] | undefined {
    const value = record[key];
    return Array.isArray(value) && value.every((item): item is string => typeof item === 'string')
        ? value
        : undefined;
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : formatUnknown(error);
}

export function formatUnknown(value: unknown): string {
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }

    if (value === null || value === undefined) {
        return String(value);
    }

    try {
        return JSON.stringify(value) ?? Object.prototype.toString.call(value);
    } catch {
        const fallback = Object.prototype.toString.call(value) as string;
        return fallback;
    }
}
