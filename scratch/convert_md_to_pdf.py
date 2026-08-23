import os
import glob
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Skill Document</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/core.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css">
<style>
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    padding: 0;
    margin: 0;
  }
  .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 100%;
    margin: 0 auto;
    font-size: 13px;
    line-height: 1.6;
  }
  .markdown-body h1 {
    font-size: 24px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin-top: 24px;
    color: #0f172a;
    page-break-after: avoid;
  }
  .markdown-body h2 {
    font-size: 18px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 6px;
    margin-top: 20px;
    color: #0f172a;
    page-break-after: avoid;
  }
  .markdown-body h3 {
    font-size: 15px;
    margin-top: 16px;
    color: #334155;
    page-break-after: avoid;
  }
  .markdown-body pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    font-size: 12px;
    page-break-inside: avoid;
  }
  .markdown-body code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
  }
  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    page-break-inside: avoid;
  }
  .markdown-body th, .markdown-body td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
  }
  .markdown-body th {
    background-color: #f8fafc;
    font-weight: 700;
  }
  .header-badge {
    display: inline-block;
    background: #4f46e5;
    color: white;
    font-weight: 700;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 12px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>
<article class="markdown-body" id="content"></article>
<script>
  function renderMarkdown(mdText, skillName) {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    const headerHtml = skillName ? `<div class="header-badge">AI Skill: ${skillName}</div>` : '';
    document.getElementById('content').innerHTML = headerHtml + marked.parse(mdText);
  }
</script>
</body>
</html>
"""

async def convert_all_md_to_pdf():
    base_dir = Path(r"C:\Users\priya\Downloads\UI_UX_Skills")
    consolidated_pdf_dir = Path(r"C:\Users\priya\Downloads\UI_UX_Skills_PDFs")
    consolidated_pdf_dir.mkdir(parents=True, exist_ok=True)

    md_files = list(base_dir.rglob("*.md"))
    print(f"Found {len(md_files)} markdown files in {base_dir}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(HTML_TEMPLATE)

        count = 0
        for md_path in md_files:
            try:
                with open(md_path, "r", encoding="utf-8", errors="replace") as f:
                    md_text = f.read()

                rel_path = md_path.relative_to(base_dir)
                skill_folder = rel_path.parts[0] if len(rel_path.parts) > 1 else md_path.stem
                
                # Render markdown inside Chromium
                await page.evaluate("([text, name]) => renderMarkdown(text, name)", [md_text, skill_folder])
                await page.wait_for_timeout(100)

                # 1. Save PDF in same directory as the .md file
                pdf_in_place = md_path.with_suffix(".pdf")
                await page.pdf(
                    path=str(pdf_in_place),
                    format="A4",
                    print_background=True,
                    margin={"top": "18mm", "bottom": "18mm", "left": "15mm", "right": "15mm"}
                )

                # 2. Also save in consolidated folder for easy access
                # e.g., "taste-skill - SKILL.pdf" or "brand - visual-identity.pdf"
                clean_name = f"{skill_folder} - {md_path.stem}.pdf" if md_path.name != "SKILL.md" else f"{skill_folder}.pdf"
                pdf_consolidated = consolidated_pdf_dir / clean_name
                await page.pdf(
                    path=str(pdf_consolidated),
                    format="A4",
                    print_background=True,
                    margin={"top": "18mm", "bottom": "18mm", "left": "15mm", "right": "15mm"}
                )

                count += 1
                print(f"[{count}/{len(md_files)}] Converted: {rel_path} -> {clean_name}")
            except Exception as e:
                print(f"Error converting {md_path}: {e}")

        await browser.close()
        print(f"\nSuccessfully converted {count} Markdown files to PDF!")
        print(f"Consolidated PDF directory: {consolidated_pdf_dir}")

if __name__ == "__main__":
    asyncio.run(convert_all_md_to_pdf())
