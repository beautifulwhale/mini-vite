import connect from "connect";
import { blue, green } from "picocolors";

export function startServer() {
    const app = connect();
    const startTime = Date.now();

    app.listen(3000, async () => {
        console.log(
            green("🚀 No-Bundle 服务已经启动成功!"),
            `耗时: ${Date.now() - startTime}ms`
        );
        console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
    });
}
