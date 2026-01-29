export function extractClassConstructor<T = unknown>(
    module: unknown,
): (new () => T) | null {
    if (
        typeof module !== 'object' ||
        module === null ||
        !('default' in module)
    ) {
        return null;
    }

    const defaultExport = (module as { default: unknown }).default;

    // Handle nested default
    if (
        typeof defaultExport === 'object' &&
        defaultExport !== null &&
        'default' in defaultExport &&
        typeof (defaultExport as { default: unknown }).default === 'function'
    ) {
        return (defaultExport as { default: new () => T }).default;
    }

    // Handle direct class export
    if (typeof defaultExport === 'function') {
        return defaultExport as new () => T;
    }

    return null;
}

export function createClassInstance<T>(
    module: unknown,
    ExpectedClass: abstract new () => T,
): T | null {
    const ClassConstructor = extractClassConstructor<T>(module);
    if (!ClassConstructor) {
        return null;
    }

    try {
        const instance = new ClassConstructor();
        return instance instanceof ExpectedClass ? instance : null;
    } catch {
        return null;
    }
}
