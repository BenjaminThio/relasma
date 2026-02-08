from playwright.sync_api import sync_playwright, Browser, Page

def fetch_rendered_html(url: str, wait_for_selector: str) -> str:
    with sync_playwright() as p:
        browser: Browser = p.chromium.launch(headless=True)
        page: Page = browser.new_page()

        page.goto(url, wait_until='domcontentloaded')

        print('Updating/Refreshing browser...')
        for _ in range(8):
            page.mouse.wheel(0, 1200)
            page.wait_for_timeout(300)

        print(f'Waiting for selector `{wait_for_selector}` to appear...')
        page.wait_for_selector(wait_for_selector, state='attached', timeout=30000)
        html: str = page.content()
        print(f'Selector `{wait_for_selector}` is found!')

        browser.close()
        with open('test2.html', 'w', encoding='utf-8') as file:
            file.write(html)
        return html