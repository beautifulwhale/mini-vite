import { HMR_PORT } from "./../optimizer/const";
import path from "path";
import { readFile } from "fs-extra";
import { ServerContext } from "../../server";
import { CLIENT_PUBLIC_PATH } from "../optimizer/const";
import { Plugin } from "../plugin";
import { red } from "picocolors";

export function clientInjectPlugin(): Plugin {
    console.log(red("called clientInjectPlugin"));

    let s: ServerContext;
    return {
        name: "vite:clientInject",
        configureServer(serverContext) {
            s = serverContext;
        },
        resolveId: (id) => {
            if (id === CLIENT_PUBLIC_PATH) {
                return { id };
            }
            return null;
        },
        load: async (id) => {
            if (id === CLIENT_PUBLIC_PATH) {
                const { root } = s;
                const realPath = path.join(
                    root,
                    "node_modules",
                    "mini-vite",
                    "dist",
                    "client.mjs"
                );
                const code = await readFile(realPath, "utf-8");
                return {
                    code: code.replace("__HMR_PORT__", JSON.stringify(HMR_PORT)),
                };
            }
        },
        transformIndexHtml(raw) {
            console.log("raw---", raw);
            // 添加客户端脚本
            return raw.replace(
                /(<head[^>]*>)/i,
                `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`
            );
        },
    };
}
