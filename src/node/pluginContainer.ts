import type {
    LoadResult,
    PartialResolvedId,
    SourceDescription,
    PluginContext as RollupPluginContext,
    ResolvedId,
} from "rollup";
import { Plugin } from "./plugin";

export interface PluginContainer {
    resolvedId(
        id: string,
        importer?: string
    ): Promise<PartialResolvedId | null>;
    load(id: string): Promise<LoadResult | null>;
    transform(code: string, id: string): Promise<SourceDescription | null>;
}

export function createPluginContainer(plugins: Plugin[]): PluginContainer {
    // 插件容器公用的上下文对象,可实现一些公用的方法; ctx保证插件在统一的上下文,保证在模块解析、加载、转换时互相依赖
    class Context implements Partial<RollupPluginContext> {
        async resolve(id: string, importer?: string) {
            let out = await pluginContainer.resolvedId(id, importer);
            if (typeof out === "string") out = { id: out };
            return out as ResolvedId | null;
        }
    }
    const pluginContainer: PluginContainer = {
        async resolvedId(id: string, importer?: string) {
            const ctx = new Context();
            for (const plguin of plugins) {
                if (plguin.resolveId) {
                    const newId = await plguin.resolveId.call(
                        ctx,
                        id,
                        importer
                    );
                    if (newId) {
                        id = typeof newId === "string" ? newId : newId.id;
                        return { id };
                    }
                }
            }
            return null;
        },
        async load(id) {
            const ctx = new Context();
            for (const plugin of plugins) {
                if (plugin.load) {
                    const res = await plugin.load.call(ctx, id);
                    if (res) {
                        return res;
                    }
                }
            }
            return null;
        },
        async transform(code, id) {
            const ctx = new Context();
            for (const plugin of plugins) {
                if (plugin.transform) {
                    const res = await plugin.transform.call(ctx, code, id);
                    if (!res) continue;
                    if (typeof res === "string") {
                        code = res;
                    } else if (res.code) {
                        code = res.code;
                    }
                }
            }
            return { code };
        },
    };
    return pluginContainer;
}
