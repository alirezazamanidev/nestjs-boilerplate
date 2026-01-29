export function parseList(v?: string): string[] {
    return (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}
