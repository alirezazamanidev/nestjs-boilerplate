function pathToFileUrl(path: string): string {
    const url = new URL('file://');
    url.pathname = (path.startsWith('/') ? path : `/${path}`).replace(
        /\\/g,
        '/',
    );
    return url.href;
}

export async function importModule<T = any>(filePath: string): Promise<T> {
    try {
        return (await import(pathToFileUrl(filePath))) as Promise<T>;
    } catch {
        return (await import(filePath)) as Promise<T>;
    }
}
