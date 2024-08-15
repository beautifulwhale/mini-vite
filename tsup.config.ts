import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/node/cli.ts"],
    splitting: false,
    sourcemap: true,
    format: ["esm", "cjs"],
    target: "es2020",
});
