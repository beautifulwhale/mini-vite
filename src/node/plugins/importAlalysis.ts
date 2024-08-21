import { init, parse } from "es-module-lexer";
import { Plugin } from "../plugin";
import { BARE_IMPORT_RE, PRE_BUNDLE_DIR } from "../optimizer/const";
import path from "path";
import { cleanUrl, isJsRequest } from "../utils/isJsRequest";
import MagicString from "magic-string";
import { normalizePath } from "../utils/normalize";
import { ServerContext } from "../../server";
import { getShortName } from "../utils/getShortName";

export function importAnalysisPlugin(): Plugin {
    let serverContext: ServerContext;
    return {
        name: "vite:importAnalysisPlugin",
        configureServer(s) {
            serverContext = s;
        },
        transform: async (code: string, id: string) => {
            if (!isJsRequest(id)) {
                return null;
            }
            debugger;
            await init;
            const [imports] = parse(code);
            const ms = new MagicString(code);
            const resolve = async (id: string, importer?: string) => {
                const resolved = await serverContext.pluginContainer.resolvedId(
                    id,
                    normalizePath(importer as string)
                );
                if (!resolved) {
                    return;
                }
                let resolvedId = `/${getShortName(
                    resolved.id,
                    serverContext.root
                )}`;
                return resolvedId;
            };

            for (const importMod of imports) {
                const { s: startMod, e: endMod, n: sourcMod } = importMod;
                if (!sourcMod) continue;
                // import React from 'react'; 处理
                if (BARE_IMPORT_RE.test(sourcMod)) {
                    const bundlePath = normalizePath(
                        path.join("/", PRE_BUNDLE_DIR, `${sourcMod}.js`)
                    );

                    ms.overwrite(startMod, endMod, bundlePath);
                } else if (
                    sourcMod.startsWith(".") ||
                    sourcMod.startsWith("/")
                ) {
                    // import App from './App'; 处理相对路径导入
                    const resolved = await resolve(sourcMod, id);

                    if (resolved) {
                        ms.overwrite(startMod, endMod, resolved);
                    }
                }
            }
            return {
                code: ms.toString(),
                map: ms.generateMap(),
            };
        },
    };
}
