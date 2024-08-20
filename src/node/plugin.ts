import { LoadResult, PartialResolvedId, SourceDescription } from "rollup";
import { ServerContext } from "../server";
import { resolvePlugin } from "./plugins/resolve";

export type ServerHook = (
    server: ServerContext
) => (() => void) | void | Promise<(() => void) | void>;

export interface Plugin {
    name: string;
    configureServer?: ServerHook;
    resolveId?: (
        id: string,
        importer?: string
    ) => Promise<PartialResolvedId | null> | PartialResolvedId | null;
    load?: (id: string) => Promise<LoadResult | null> | LoadResult | void;
    transform?: (
        code: string,
        id: string
    ) => Promise<SourceDescription | null> | SourceDescription | null;
    transformIndexHtml?: (raw: string) => Promise<string> | string;
}

export function resolvePlugins(): Plugin[] {
    return [resolvePlugin()];
}
