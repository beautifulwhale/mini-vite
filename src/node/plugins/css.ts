import { readFile } from "fs-extra";
import { Plugin } from "../plugin";
import { isCssRequest } from "../utils/isJsRequest";
import { CLIENT_PUBLIC_PATH } from "../optimizer/const";
import { ServerContext } from "../../server";
import { getShortName } from "../utils/getShortName";

export function cssPlugin(): Plugin {
    let serverContext: ServerContext;
    return {
        name: "vite:css",
        configureServer(s) {
            serverContext = s;
        },
        load: (id) => {
            return readFile(id, "utf-8");
        },
        transform: (code, id) => {
            if (isCssRequest(id)) {
                const jsContent =
                    `
                import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
                    `import.meta.hot = __vite__createHotContext("/${getShortName(
                        id,
                        serverContext.root
                    )}");
                import { updateStyle, removeStyle } from "${CLIENT_PUBLIC_PATH}";
                const id = '${id}';
                const css = "${code.replace(/\n/g, "")}";
                updateStyle(id, css);
                import.meta.hot.accept();
                export default css
                import.meta.hot.prune(() => removeStyle(id));
            `.trim();

                return {
                    code: jsContent,
                };
            }
            return null;
        },
    };
}
