from playwright.sync_api import Browser, Page, sync_playwright
from bs4 import BeautifulSoup, ResultSet, Tag
from typing import TypedDict

class EmojiDesignTimeline(TypedDict):
    date: str | None
    image_url: str | None
    version: str | None

class EmojiDesign(TypedDict):
    title: str | None
    description: str | None
    timelines: list[EmojiDesignTimeline]

def scrape_designs(url: str) -> list[EmojiDesign]:
    with sync_playwright() as p:
        print('Launching browser...')

        browser: Browser = p.chromium.launch(headless=True)
        page: Page = browser.new_page()

        page.goto(url, wait_until='domcontentloaded')

        design_tab = page.locator('a[role="tab"]', has_text='Emoji Designs') # page.get_by_role('tab', name='Emoji Designs')
        active_tab = page.locator('a[role="tab"][data-active="true"]', has_text='Emoji Designs')

        print('Waiting for the page to render...')
        design_tab.wait_for(state='visible', timeout=60000)

        print('Attempting to click Emoji Designs tab...')
        tab_activated: bool = False

        attempt: int = 0

        while (True):
            design_tab.evaluate('node => node.click()') # design_tab.click()

            try:
                active_tab.wait_for(state='attached', timeout=1000)
                tab_activated = True
                print(f'Tab activated successfully on attempt {attempt + 1}!')
                break
            except Exception:
                print(f'The click failed on attempt {attempt + 1} because Next.js wasn\'t ready. Proceed retry...')
                attempt += 1
                pass

        if not tab_activated:
            print("Error: Could not activate the tab after multiple attempts.")
            return []
        
        page.wait_for_selector('div.mb-6', state='visible', timeout=10000)

        raw_html: str = page.content()

        # with open('test2.html', 'w', encoding='utf-8') as file:
        #     file.write(raw_html)

        # print(raw_html)

        soup: BeautifulSoup = BeautifulSoup(raw_html, 'html.parser')

        emoji_designs: list[EmojiDesign] = []

        for design in soup.select('div[class="mb-6"]'):
            print('=' * 40 + '\n')

            title_tag: Tag | None = design.select_one('h3[class="text-left mb-2"]')
            description_tag: Tag | None = design.select_one('div[class="mb-2 text-left text-typography-secondary"]')
            timelines_wrapper: Tag | None = design.select_one('div[class^="EmojiTimeline_emoji-timeline-pins-list"]')

            title: str | None = title_tag.get_text() if title_tag is not None else None
            description: str | None = description_tag.get_text() if description_tag is not None else None
            emoji_design: EmojiDesign = {'title': title, 'description': description, 'timelines': []}

            print(f"Title: {title}")
            print(f"Description: {description}")

            if timelines_wrapper != None:
                timelines_tags: ResultSet[Tag] = timelines_wrapper.select('div[class^="EmojiTimeline_emoji-timeline-pin-container"]')

                for timeline_tag in timelines_tags:
                    date_tag: Tag | None = timeline_tag.select_one('p[class^="text-left EmojiTimeline_emoji-timeline-pin-date"]')
                    image_tag: Tag | None = timeline_tag.select_one('img')
                    image_url: str | None = str(image_tag.get('src')) if image_tag is not None else None
                    version_tag: Tag | None = timeline_tag.select_one('p[class^="text-left EmojiTimeline_emoji-timeline-pin-title"]')

                    date: str | None = date_tag.get_text() if date_tag is not None else None
                    version: str | None = version_tag.get_text() if version_tag is not None else None

                    timeline: EmojiDesignTimeline = {'date': date, 'image_url': image_url, 'version': version}

                    emoji_design['timelines'].append(timeline)

                    print(f"Date: {date}")
                    print(f"Image Source: {image_url}")
                    print(f"Version: {version}\n")
            
            emoji_designs.append(emoji_design)

            print('=' * 40)

        return emoji_designs

if __name__ == '__main__':
    print(scrape_designs('https://emojipedia.org/face-holding-back-tears'))