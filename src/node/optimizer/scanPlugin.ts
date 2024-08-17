import { Plugin } from "esbuild";
import { EXTERNAL_TYPES, BARE_IMPORT_RE } from "./const";

export function scanPlugin(deps: Set<string>): Plugin {
    return {
        name: "esbuild:scan-deps",
        setup(build) {
            // 忽略一些文件 eg: css、less、vue...
            build.onResolve(
                { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) },
                (args) => {
                    return {
                        path: args.path,
                        external: true,
                    };
                }
            );

            // 处理bare import
            build.onResolve({ filter: BARE_IMPORT_RE }, (args) => {
                const { path: id } = args;
                deps.add(id);
                return {
                    path: id,
                    external: true,
                };
            });
        },
    };
}
