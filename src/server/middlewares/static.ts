import { NextHandleFunction } from "connect";
import sirv from "sirv";
import { isImportRequest } from "../../node/utils/isJsRequest";

export function staticMiddleware(root: string): NextHandleFunction {
    const s = sirv(root, { dev: true });

    return async (req, res, next) => {
        if (!req.url) return;
        if (isImportRequest(req.url)) return;
        s(req, res, next);
    };
}
