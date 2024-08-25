import esbuild, { Loader } from "esbuild";
import { readFile } from "fs-extra";
import path from "path";
import { Plugin } from "../plugin";
import { isImportRequest, isJsRequest } from "../utils/isJsRequest";

export function esbuildTransformPlugin(): Plugin {
    return {
        name: "vite:esbuild-transform",
        load: async (id: string) => {
            try {
                if (isJsRequest(id)) {
                    const code = await readFile(id, "utf-8");
                    return code;
                }
            } catch (error) {
                return null;
            }
        },
        transform: async (code: string, id: string) => {
            try {
                if (isJsRequest(id)) {
                    const e = path.extname(id).slice(1);
                    const { code: transformCode, map } =
                        await esbuild.transform(code, {
                            target: "esnext",
                            format: "esm",
                            sourcemap: true,
                            loader: e as Loader,
                        });
                    return {
                        code: transformCode,
                        map,
                    };
                }
                return null;
            } catch (error) {
                return null;
            }
        },
    };
}
