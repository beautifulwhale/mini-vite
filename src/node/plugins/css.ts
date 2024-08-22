import { readFile } from "fs-extra";
import { Plugin } from "../plugin";
import { isCssRequest } from "../utils/isJsRequest";

export function cssPlugin(): Plugin {
    return {
        name: "vite:css",
        load: (id) => {
            return readFile(id, "utf-8");
        },
        transform: (code, id) => {
            if (isCssRequest(id)) {
                const jsContent = `
                const css = "${code.replace(/\n/g, "")}";
                const style = document.createElement("style");
                style.setAttribute("style", "text/css")
                style.innerHTML = css;
                document.head.appendChild(style);
                export default css
            `.trim();

                return {
                    code: jsContent,
                };
            }
            return null;
        },
    };
}
