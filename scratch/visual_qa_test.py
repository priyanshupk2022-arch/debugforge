import asyncio
import os
from playwright.async_api import async_playwright

async def run_visual_qa():
    os.makedirs("artifacts/screenshots", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test 1: Desktop 1440
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            # Check local frontend if running or load Next build preview
            print("Connecting to frontend at http://localhost:3000...")
            await page.goto("http://localhost:3000", timeout=5000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path="artifacts/screenshots/desktop_1440_hero.png", full_page=False)
            print("Captured Desktop 1440 Hero screenshot")

            # Test 2: Tablet 1024
            await page.set_viewport_size({"width": 1024, "height": 768})
            await page.screenshot(path="artifacts/screenshots/tablet_1024.png", full_page=False)
            print("Captured Tablet 1024 screenshot")

            # Test 3: Mobile 390
            await page.set_viewport_size({"width": 390, "height": 844})
            await page.screenshot(path="artifacts/screenshots/mobile_390.png", full_page=False)
            print("Captured Mobile 390 screenshot")

            # Test 4: App Route /app
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto("http://localhost:3000/app", timeout=5000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path="artifacts/screenshots/app_cockpit_1440.png", full_page=False)
            print("Captured Cockpit /app screenshot")
        except Exception as e:
            print(f"Dev server check note: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_visual_qa())
