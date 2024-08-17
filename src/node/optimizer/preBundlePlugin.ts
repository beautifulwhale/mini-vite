import { Plugin, Loader } from "esbuild";
import { BARE_IMPORT_RE } from "./const";
import resolve from "resolve";
import { init, parse } from "es-module-lexer";
import fs from "fs-extra";
import path from "path";
import { normalizePath } from "../utils/normalize";
import createDebug from "debug";

const debug = createDebug("dev");
export function preBundlePlugin(deps: Set<string>): Plugin {
    return {
        name: "esbuild:pre-bundle",
        setup(build) {
            build.onResolve({ filter: BARE_IMPORT_RE }, (args) => {
                const { path: id, importer } = args;
                const isEntry = !importer; // 是否为入口文件
                if (deps.has(id)) {
                    return isEntry
                        ? {
                              path: id,
                              namespace: "dev",
                          }
                        : {
                              path: resolve.sync(id, {
                                  basedir: process.cwd(),
                              }),
                          };
                }
            });

            build.onLoad(
                { filter: /.*/, namespace: "dev" },
                async (args) => {
                    await init;
                    const id = args.path;
                    const root = process.cwd();
                    const entryPath = normalizePath(
                        resolve.sync(id, { basedir: root })
                    );
                    const code = await fs.readFile(entryPath, "utf8");
                    // 词法分析解析
                    const [imports, exports] = parse(code);

                    const proxyModules = [];
                    // cjs
                    if (!imports.length && !exports.length) {
                        // 构造代理模块
                        const res = require(entryPath);
                        // 可支持按需导入
                        const specifiers = Object.keys(res);
                        proxyModules.push(
                            `export { ${specifiers.join(
                                ","
                            )} } from "${entryPath}"`,
                            `export default require("${entryPath}")`
                        );
                    } else {
                        // esm
                        if (exports.includes("default")) {
                            proxyModules.push(
                                `import d from "${entryPath}";export default d`
                            );
                        }
                        proxyModules.push(`export * from "${entryPath}"`);
                    }
                    const loader = path.extname(entryPath).slice(1);
                    const contents = proxyModules.join("\n");
                    debug("pre-budle contents: %o ", contents);
                    return {
                        loader: loader as Loader,
                        contents: contents,
                        resolveDir: root,
                    };
                }
            );
        },
    };
}
