import { ServerContext } from "../../server";
import { Plugin } from "../plugin";
import { getShortName } from "../utils/getShortName";
import { cleanUrl, removeImportQuery } from "../utils/isJsRequest";
import { normalizePath } from "../utils/normalize";

export function assetPlugin(): Plugin {
    let serverContext: ServerContext;
    return {
        name: "vite:asset",
        configureServer: (s) => {
            serverContext = s;
        },
        async load(id) {
            const cleanedId = removeImportQuery(cleanUrl(id));
            const resolvedId = `/${getShortName(
                normalizePath(id),
                serverContext.root
            )}`;

            // 这里仅处理 svg
            if (cleanedId.endsWith(".svg")) {
                return {
                    code: `export default "${resolvedId}"`,
                };
            }
        },
    };
}
