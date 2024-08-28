import { ServerContext } from "../server";
import { blue, green } from "picocolors";
import { getShortName } from "./utils/getShortName";

export function bindingHmrEvents(serverContext: ServerContext) {
    const { ws, watcher, moduleGraph, root } = serverContext;

    // 监测变化的文件
    watcher.on("change", async (file) => {
        console.log(`✨${blue("[hmr]")} ${green(file)}changed`);

        // 清除模块依赖图中的缓存
        await moduleGraph.invalidateModule(file);

        ws.send({
            type: "updated",
            updates: [
                {
                    type: "js-changed",
                    timestamp: Date.now(),
                    path: `${getShortName(file, root)}`,
                    acceptPath: `${getShortName(file, root)}`,
                },
            ],
        });
    });
}
