import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/node/cli.ts",
        client: "src/client/client.ts",
    },
    splitting: false,
    sourcemap: true,
    format: ["esm", "cjs"],
    target: "es2020",
});
