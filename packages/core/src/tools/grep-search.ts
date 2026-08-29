import fs from "node:fs/promises";
import path from "node:path";

export interface GrepOptions {
  searchDir: string;
  pattern: string;
  fileExtensions?: string[];
}

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export async function grepSearchTool(options: GrepOptions): Promise<GrepMatch[]> {
  const matches: GrepMatch[] = [];
  const regex = new RegExp(options.pattern, "i");
  const validExts = options.fileExtensions || [".ts", ".js", ".tsx", ".jsx", ".json", ".md"];

  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (validExts.includes(ext)) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const lines = content.split(/\r?\n/);
            lines.forEach((lineText, idx) => {
              if (regex.test(lineText)) {
                matches.push({
                  file: fullPath.replace(/\\/g, "/"),
                  line: idx + 1,
                  content: lineText.trim(),
                });
              }
            });
          } catch {}
        }
      }
    }
  }

  await scanDirectory(path.resolve(options.searchDir));
  return matches;
}
