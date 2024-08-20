import { ServerContext } from "../../server";
import { Plugin } from "../plugin";
import { pathExists } from "fs-extra";
import path from "path";
import { normalizePath } from "../utils/normalize";
import resolve from "resolve";

const EXTENSION_TYPES = ["js", "jsx", "ts", "tsx"];

// 路径解析插件
export function resolvePlugin(): Plugin {
    let serverContext: ServerContext;
    return {
        name: "vite:resolve",
        configureServer: (s) => {
            serverContext = s;
        },
        resolveId: async (id: string, importer?: string) => {
            // 1. 绝对路径
            if (path.isAbsolute(id)) {
                id = path.join(serverContext.root, id);
                if (await pathExists(id)) {
                    return { id };
                }
            } else if (id.startsWith(".")) {
                // 2. 相对路径
                if (!importer) {
                    throw new Error("importer is necessary");
                }

                let resolveId: string;
                const hasExtension = path.extname(id).length > 1;
                if (hasExtension) {
                    // 2.1 ./App.tsx
                    resolveId = normalizePath(
                        resolve.sync(id, { basedir: path.dirname(importer) })
                    );
                    if (await pathExists(resolveId)) {
                        return { id: resolveId };
                    }
                } else {
                    // 2.2 ./App
                    for (const e of EXTENSION_TYPES) {
                        try {
                            const withExtension = `${id}${e}`;
                            resolveId = normalizePath(
                                resolve.sync(withExtension, {
                                    basedir: path.dirname(importer),
                                })
                            );
                            if (await pathExists(resolveId)) {
                                return { id: resolveId };
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                }
            }

            return null;
        },
    };
}
