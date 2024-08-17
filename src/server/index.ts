import connect from "connect";
import { blue, green } from "picocolors";
import { optimizer } from "../node/optimizer";

export async function startServer() {
    const app = connect();
    const startTime = Date.now();
    const root = process.cwd();

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
