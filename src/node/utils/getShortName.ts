import path from "path";

export function getShortName(file: string, root: string) {
    return file.startsWith(root + "/") ? path.posix.relative(root, file) : file;
}
