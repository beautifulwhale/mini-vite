import path from "path";
import { build } from "esbuild";
import { green } from "picocolors";
import { scanPlugin } from "./scanPlugin";
import { PRE_BUNDLE_DIR } from "./const";
import { preBundlePlugin } from "./preBundlePlugin";

export async function optimizer(root: string) {
    // 1. 确定预构建入口
    const entry = path.resolve(root, "src/main.tsx");
    // 2. 扫描需要预构建依赖
    const deps = new Set<string>();
    await build({
        entryPoints: [entry],
        sourcemap: true,
        bundle: true,
        write: false,
        plugins: [scanPlugin(deps)],
    });

    console.log(
        `${green("需要预构建的依赖")}:\n${[...deps]
            .map(green)
            .map((item) => `  ${item}`)
            .join("\n")}`
    );

    // 对依赖进行打包
    await build({
        entryPoints: [...deps],
        write: true,
        bundle: true,
        format: 'esm',
        splitting: true,
        outdir: path.resolve(root, PRE_BUNDLE_DIR),
        plugins: [preBundlePlugin(deps)],
    });
}
