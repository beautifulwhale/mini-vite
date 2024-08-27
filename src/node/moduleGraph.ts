import { TransformResult, PartialResolvedId } from "rollup";

// 模块节点
export class ModuleNode {
    url: string;
    id: string | null = null;
    importers = new Set<ModuleNode>();
    importedModules = new Set<ModuleNode>();
    transformResult: TransformResult | null = null;
    lastHMRTimestamp = 0;
    constructor(url: string) {
        this.url = url;
    }
}

// 模块依赖图
export class ModuleGraph {
    urlToModuleMap = new Map<string, ModuleNode>();
    idToModuleMap = new Map<string, ModuleNode>();

    constructor(
        private resolveId: (url: string) => Promise<PartialResolvedId | null>
    ) {}

    private async _resolve(
        url: string
    ): Promise<{ url: string; resolveId: string }> {
        const resolved = await this.resolveId(url);
        const resolveId = resolved?.id || url;
        return { resolveId, url };
    }

    getModuleById(id: string): ModuleNode | undefined {
        return this.idToModuleMap.get(id);
    }

    async getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined> {
        const { url } = await this._resolve(rawUrl);
        return this.urlToModuleMap.get(url);
    }

    // 初始化加载模块节点
    async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
        const { resolveId, url } = await this._resolve(rawUrl);

        // 存在缓存返回缓存
        if (this.urlToModuleMap.has(url)) {
            return this.getModuleById(url) as ModuleNode;
        }
        // 构建新的模块节点
        const mod = new ModuleNode(url);
        mod.id = resolveId;
        this.idToModuleMap.set(resolveId, mod);
        this.urlToModuleMap.set(url, mod);
        return mod;
    }

    // 更新模块依赖关系
    /**
     * @param mod 当前模块
     * @param importedModules 最新的依赖模块
     */
    async updateModuleInfo(
        mod: ModuleNode,
        importedModules: Set<string | ModuleNode>
    ) {
        const prevImports = mod.importedModules;
        for (const i of importedModules) {
            const dep =
                typeof i === "string"
                    ? await this.ensureEntryFromUrl(i as string)
                    : i;
            if (dep) {
                mod?.importedModules.add(dep);
                dep.importers.add(mod as ModuleNode);
            }
        }
        // 清除已经不再被引用的依赖
        for (const prevImport of prevImports) {
            if (!importedModules.has(prevImport.url)) {
                prevImport.importers.delete(mod);
            }
        }
    }

    // hmr热更新清除依赖
    async invalidateModule(file: string) {
        const mod = this.getModuleById(file);
        if (mod) {
            mod.lastHMRTimestamp = Date.now();
            mod.transformResult = null;
            mod.importers.forEach((importer) => {
                this.invalidateModule(importer.id!);
            });
        }
    }
}
