// 特殊处理win系统路径
import os from "os";
import path from "path";

const slash = (path: string) => {
    return path.replace(/\\/g, "/");
};
const isWindows = os.platform() === "win32";

export function normalizePath(id: string): string {
    return path.posix.normalize(isWindows ? slash(id) : id);
}
