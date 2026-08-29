import fs from "node:fs/promises";
import path from "node:path";

export interface ReadFileOptions {
  filePath: string;
  startLine?: number;
  endLine?: number;
}

export async function readFileTool(options: ReadFileOptions): Promise<string> {
  const resolved = path.resolve(options.filePath);
  const content = await fs.readFile(resolved, "utf-8");
  const lines = content.split(/\r?\n/);

  if (options.startLine !== undefined && options.endLine !== undefined) {
    const start = Math.max(1, options.startLine) - 1;
    const end = Math.min(lines.length, options.endLine);
    return lines.slice(start, end).join("\n");
  }

  return content;
}
