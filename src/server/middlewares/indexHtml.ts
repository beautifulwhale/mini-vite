import { pathExists, readFile } from "fs-extra";
import path from "path";
import { NextHandleFunction } from "connect";
import { ServerContext } from "../index";

// 入口HTML加载
export function indexHtmlMiddleware(
    serverContext: ServerContext
): NextHandleFunction {
    return async (req, res, next) => {
        if (req.url === "/") {
            const { root, plugins } = serverContext;
            const htmlPath = path.join(root, "index.html");
            let html = "";
            if (await pathExists(htmlPath)) {
                html = await readFile(htmlPath, "utf-8");
            }

            for (const plugin of plugins) {
                if (plugin.transformIndexHtml) {
                    html = await plugin.transformIndexHtml(html);
                }
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            return res.end(html);
        }
        return next();
    };
}
