import path from "path";
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
export const QEURY_RE = /\?.*$/s;
export const HASH_RE = /#.*$/s;

export const isJsRequest = (url: string): boolean => {
    url = cleanUrl(url);
    if (JS_TYPES_RE.test(url)) {
        return true;
    }
    if (!path.extname(url) && !url.endsWith("/")) {
        return true;
    }
    return false;
};

export const cleanUrl = (url: string): string =>
    url.replace(QEURY_RE, "").replace(HASH_RE, "");
