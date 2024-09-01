import { Update } from "./type";
console.log("[vite] connecting...");

const ws = new WebSocket(`ws://localhost:__HMR_PORT__`, "vite-hmr");

ws.addEventListener("message", async (message) => {
    handleMessage(JSON.parse(message.data)).catch(console.error);
});

async function handleMessage(payload: any) {
    const { type } = payload;
    switch (type) {
        case "connected":
            console.log("[vite] connected");
            setInterval(() => {
                ws.send("ping...");
            });
            break;
        case "updated":
            payload.updates.forEach(async (u: Update) => {
                if (u.type === "js-changed") {
                    const updated = await fetchUpdate(u);
                    if (updated) {
                        updated();
                    }
                }
            });
            break;
        default:
            break;
    }
}

export interface HotModule {
    id: string;
    callbacks: HotModuleCallbacks[];
}

export interface HotModuleCallbacks {
    deps: string[];
    fn: (modules: any[]) => void;
}

const hotModulesMap = new Map<string, HotModule>();

const pruneMap = new Map<string, (data: any) => void | Promise<void>>();

export function createHotContext(ownPath: string) {
    const mod = hotModulesMap.get(ownPath);
    if (mod) {
        mod.callbacks = [];
    }

    function acceptFn(deps: string[], cb: any) {
        const module: HotModule = hotModulesMap.get(ownPath) || {
            id: ownPath,
            callbacks: [],
        };
        // callbacks 属性存放 accept 的依赖、依赖改动后对应的回调逻辑
        module.callbacks.push({
            deps,
            fn: cb,
        });
        hotModulesMap.set(ownPath, module);
    }

    return {
        // 仅考虑自身模块更新的情况
        accept: (deps: any, callback?: any) => {
            if (typeof deps === "function" || !deps) {
                acceptFn([ownPath], ([mod]: any) => deps && deps(mod));
            }
        },
        prune: (cb: (data: any) => void) => {
            pruneMap.set(ownPath, cb);
        },
    };
}

async function fetchUpdate({
    path,
    timestamp,
}: Update): Promise<(() => void) | undefined> {
    const mod = hotModulesMap.get(path);
    if (!mod) return;

    const moduleMap = new Map();
    const moduleUpdatePath = new Set<string>();

    moduleUpdatePath.add(path);

    // 更新模块内容
    await Promise.all(
        Array.from(moduleUpdatePath).map(async (dep) => {
            const [path, query] = dep.split("?");
            const newMod = await import(
                `${path}?timestamp=${timestamp}${query ? `&${query}` : ""}`
            );
            moduleMap.set(path, newMod);
        })
    );

    // 这个什么时机调用
    return () => {
        for (const { deps, fn } of mod.callbacks) {
            fn(deps.map((dep) => moduleMap.get(dep)));
        }
        console.log(`[vite] hot updated: ${path}`);
    };
}

const sheetsMap = new Map();
export function updateStyle(id: string, content: string) {
    let style = sheetsMap.get(id);
    if (!style) {
        style = document.createElement("style");
        style.setAttribute("type", "text/css");
        style.innerHTML = content;
        document.head.appendChild(style);
    } else {
        style.innerHTML = content;
    }
    sheetsMap.set(id, style);
}

export function removeStyle(id: string): void {
    const style = sheetsMap.get(id);
    if (style) {
        document.head.removeChild(style);
    }
    sheetsMap.delete(id);
}
