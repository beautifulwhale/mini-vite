import { NextHandleFunction } from "connect";
import createDebug from "debug";
import { ServerContext } from "..";
import {
    cleanUrl,
    isCssRequest,
    isJsRequest,
    isImportRequest,
} from "../../node/utils/isJsRequest";
import { SourceDescription } from "rollup";

const debug = createDebug("dev");

export async function transformRequest(
    url: string,
    serverContext: ServerContext
) {
    const { pluginContainer, moduleGraph } = serverContext;
    url = cleanUrl(url);
    // 添加缓存逻辑
    let mod = await moduleGraph.getModuleByUrl(url);
    if (mod && mod.transformResult) {
        return mod.transformResult as Partial<SourceDescription>;
    }

    // 依次调用resolveId load transform
    const resolveResult = await pluginContainer.resolvedId(url);
    let transformResult;
    if (resolveResult?.id) {
        let code = await pluginContainer.load(resolveResult.id);
        if (typeof code === "object" && code !== null) {
            code = code.code;
        }
        mod = await moduleGraph.ensureEntryFromUrl(url);

        if (code) {
            transformResult = await pluginContainer.transform(
                code as string,
                resolveResult.id
            );
        }
    }
    // 更新新的模块
    if (mod) {
        mod.transformResult = transformResult;
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

        if (isJsRequest(url) || isCssRequest(url) || isImportRequest(url)) {
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
