import connect from "connect";
import { blue, green } from "picocolors";
import chokidar, { FSWatcher } from "chokidar";
import { optimizer } from "../node/optimizer";
import {
    createPluginContainer,
    PluginContainer,
} from "../node/pluginContainer";
import { resolvePlugins, Plugin } from "../node/plugin";
import { indexHtmlMiddleware } from "./middlewares/indexHtml";
import { transformMiddleware } from "./middlewares/transform";
import { staticMiddleware } from "./middlewares/static";
import { ModuleGraph } from "../node/moduleGraph";
import { createWebSocketServer, WsServer } from "../node/ws";

export interface ServerContext {
    app: connect.Server;
    root: string;
    plugins: Plugin[];
    pluginContainer: PluginContainer;
    moduleGraph: ModuleGraph;
    watcher: FSWatcher;
    ws: WsServer;
}

export async function startServer() {
    const app = connect();
    const startTime = Date.now();
    const root = process.cwd();
    const plugins = resolvePlugins();
    const pluginContainer = createPluginContainer(plugins);
    const moduleGraph = new ModuleGraph((url: string) =>
        pluginContainer.resolvedId(url)
    );
    const ws = createWebSocketServer();

    // 创建文件监视
    const watcher = chokidar.watch(root, {
        ignored: ["**/node_modules/**", "**/.git/**"],
        ignoreInitial: true,
    });

    const serverContext: ServerContext = {
        app,
        root,
        plugins,
        pluginContainer,
        moduleGraph,
        watcher,
        ws,
    };

    for (const plugin of plugins) {
        if (plugin.configureServer) {
            await plugin.configureServer(serverContext);
        }
    }

    app.use(indexHtmlMiddleware(serverContext));
    app.use(transformMiddleware(serverContext));
    app.use(staticMiddleware(serverContext.root));

    app.listen(3000, async () => {
        // 依赖预构建
        await optimizer(root);

        console.log(
            green("🚀 No-Bundle 服务已经启动成功了!"),
            `耗时: ${Date.now() - startTime}ms`
        );
        console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
    });
}
