import { NextHandleFunction } from "connect";
import createDebug from "debug";
import { ServerContext } from "..";
import { cleanUrl, isJsRequest } from "../../node/utils/isJsRequest";

const debug = createDebug("dev");

export async function transformRequest(
    url: string,
    serverContext: ServerContext
) {
    url = cleanUrl(url);
    const { pluginContainer } = serverContext;

    // 依次调用resolveId load transform
    const resolveResult = await pluginContainer.resolvedId(url);
    let transformResult;
    if (resolveResult?.id) {
        let code = await pluginContainer.load(resolveResult.id);
        if (typeof code === "object" && code !== null) {
            code = code.code;
        }
        if (code) {
            transformResult = await pluginContainer.transform(
                code as string,
                resolveResult.id
            );
        }
    }
    return transformResult;
}

// 处理jsx js tsx ts文件
export function transformMiddleware(
    serverContext: ServerContext
): NextHandleFunction {
    return async (req, res, next) => {
        if (req.method !== "GET" || !req.url) {
            return next();
        }

        const url = req.url;
        debug("transformMiddleware: %s", url);

        if (isJsRequest(url)) {
            const result = await transformRequest(url, serverContext);
            if (!result) {
                return next();
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/javascript");
            return res.end(result.code);
        }

        next();
    };
}
