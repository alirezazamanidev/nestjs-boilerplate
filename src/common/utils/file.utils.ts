export const VALID_FILE_EXTENSIONS = ['.ts', '.js'];

export const EXCLUDED_FILE_PREFIXES = ['_'];
export const EXCLUDED_FILE_SUFFIXES = ['.map', '.d.ts'];

export function shouldExcludeFile(filename: string): boolean {
    const hasExcludedPrefix = EXCLUDED_FILE_PREFIXES.some((prefix) =>
        filename.startsWith(prefix),
    );
    const hasExcludedSuffix = EXCLUDED_FILE_SUFFIXES.some((suffix) =>
        filename.endsWith(suffix),
    );
    const hasValidExtension = VALID_FILE_EXTENSIONS.some((ext) =>
        filename.endsWith(ext),
    );

    return hasExcludedPrefix || hasExcludedSuffix || !hasValidExtension;
}
