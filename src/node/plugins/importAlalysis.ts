import { init, parse } from "es-module-lexer";
import { Plugin } from "../plugin";
import {
    BARE_IMPORT_RE,
    CLIENT_PUBLIC_PATH,
    PRE_BUNDLE_DIR,
} from "../optimizer/const";
import path from "path";
import { cleanUrl, isJsRequest } from "../utils/isJsRequest";
import MagicString from "magic-string";
import { normalizePath } from "../utils/normalize";
import { ServerContext } from "../../server";
import { getShortName } from "../utils/getShortName";
import { ModuleNode } from "../moduleGraph";

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
            const { moduleGraph } = serverContext;
            const curModule = moduleGraph.getModuleById(id)!;
            const importedModules = new Set<string>();

            for (const importMod of imports) {
                const { s: startMod, e: endMod, n: sourcMod } = importMod;
                if (!sourcMod) continue;

                // 处理svg 导入添加?import 返回静态资源的真实地址
                if (sourcMod.endsWith(".svg")) {
                    const resolveUrl = await resolve(sourcMod, id);
                    ms.overwrite(startMod, endMod, `${resolveUrl}?import`);
                    continue;
                }
                if (BARE_IMPORT_RE.test(sourcMod)) {
                    // import React from 'react';
                    const bundlePath = normalizePath(
                        path.join("/", PRE_BUNDLE_DIR, `${sourcMod}.js`)
                    );

                    importedModules.add(bundlePath);
                    ms.overwrite(startMod, endMod, bundlePath);
                } else if (
                    sourcMod.startsWith(".") ||
                    sourcMod.startsWith("/")
                ) {
                    // import App from './App'; 处理相对路径导入
                    const resolved = await resolve(sourcMod, id);
                    importedModules.add(resolved as string);
                    if (resolved) {
                        ms.overwrite(startMod, endMod, resolved);
                    }
                }
            }

            if (!id.includes("node_modules")) {
                ms.prepend(
                    `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
                        `import.meta.hot = __vite__createHotContext(${JSON.stringify(
                            curModule.url
                        )});`
                );
            }
            await moduleGraph.updateModuleInfo(
                curModule as ModuleNode,
                importedModules
            );
            return {
                code: ms.toString(),
                map: ms.generateMap(),
            };
        },
    };
}
