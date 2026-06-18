import json
from pathlib import Path
import requests
from requests import Response, Session
from bs4 import BeautifulSoup, Tag
from typing import NotRequired, TypedDict, cast
import time
import random

from requests.adapters import HTTPAdapter
from urllib3 import Retry
from advance_scraper import fetch_rendered_html
from emoji_designs_scraper import EmojiDesign, scrape_designs

BASE_URL: str = 'https://emojipedia.org/'
HEADERS: dict[str, str] = {'User-Agent': 'Mozilla/5.0'}
CATEGORIES: dict[str, str] = {
    'Smileys': 'smileys',
    'People': 'people',
    'Animals & Nature': 'nature',
    'Food & Drink': 'food-drink',
    'Activity': 'activity',
    'Travel & Places': 'travel-places',
    'Objects': 'objects',
    'Symbols': 'symbols',
    'Flags': 'flags'
}
RAW_EMOJI_JSON_FILE: str = 'raw_emoji.json'
EMOJI_JSON_FILE: str = 'emoji.jsonl'

class EmojiCategory(TypedDict):
    main: str | None
    sub: str | None

class Category:
    main: str | None = None
    sub: str | None = None

    def __init__(self, main: str | None, sub: str | None) -> None:
        self.main = main
        self.sub = sub
    
    def __str__(self) -> str:
        return f'Main category: {self.main}, Subcategory: {self.sub}'

    def to_dict(self) -> EmojiCategory:
        return cast(EmojiCategory, self.__dict__)

class EmojiContent:
    name: str | None = None
    descs: list[str] | None = None
    alert: str | None = None
    designs: list[EmojiDesign] | None = None

    def __init__(self, name: str | None, descs: list[str] | None, alert: str | None, designs: list[EmojiDesign] | None) -> None:
        self.name = name
        self.descs = descs
        self.alert = alert
        self.designs = designs

class BasicEmojiInfo(TypedDict):
    en: str
    status: int
    E: float
    alias: NotRequired[list[str]]
    variant: NotRequired[bool]

class AdvanceEmojiInfo(TypedDict):
    character: str
    name: str | None
    description: list[str] | None
    alert: NotRequired[str]
    code: str
    render_quality: int
    version: float
    alias: NotRequired[list[str]]
    variant: NotRequired[bool]
    category: EmojiCategory
    designs: list[EmojiDesign] | None

category_data: dict[str, Category] = {}

def code_2_slug(code: str) -> str:
    return (code.replace(':', '')
                .replace('_', '-')
                .replace('(', '')
                .replace(')', '')
                .replace('flag_for', 'flag-')
                .replace('Å', 'a')
                .replace('.', '')
                .replace('&', '')
                .replace('--', '-')
                .replace('ç', 'c')
                .replace('ô', 'o')
                .replace('’', '')
                .replace('!', '')
                .replace('é', 'e')
                .replace('ã', 'a')
                .replace('ü', 'u')
                .replace('í', 'i')
                .replace('ñ', 'n')
                .lower())

def generate_emoji_category_data(from_scratch: bool = False) -> None:
    global category_data

    if from_scratch:
        print(f'Collecting and generating `category_data` from scratch by scraping data from `{BASE_URL}`...')

        for category, slug in CATEGORIES.items():
            print(f'Main category: `{category}`')

            url = f'{BASE_URL}{slug}'
            soup: BeautifulSoup = BeautifulSoup(fetch_rendered_html(url, 'a[class*="Emoji_emoji"]'), 'html.parser')
            subcategories_wrapper: Tag | None = soup.select_one('div[class^="MainSection_main-section"]')

            if subcategories_wrapper is not None:
                for subcategory_container in subcategories_wrapper.select(r'div.mb-4.scroll-mt-\[140px\].md\:scroll-mt-\[180px\]'):
                    subcategory_header: Tag | None = subcategory_container.select_one(r'h2.text-left.mb-3.heading-2xl-mobile.md\:heading-xl')
                    emojis_wrapper: Tag | None = subcategory_container.select_one(r'div.flex.flex-row.flex-wrap.justify-center.md\:justify-start.items-center')

                    print(f'Subcategory: {subcategory_header.get_text() if subcategory_header is not None else None}')
                    if emojis_wrapper is not None:
                        for emoji_link in emojis_wrapper.find_all(
                            "a",
                            class_=lambda c: (
                                c is not None
                                and any(cls.startswith('Link_link-wrapper') for cls in c.split(' '))
                                and any(cls.startswith('Emoji_emoji') for cls in c.split(' '))
                            )
                        ): # .select('a[class*=" Emoji_emoji__"]')
                            print(f'{emoji_link.get_text()} is found.')
                            category_data[emoji_link.get_text()] = Category(category, subcategory_header.get_text() if subcategory_header is not None else None)
                    else:
                        print('Error: Emojis wrapper not found.')
            else:
                print('Error: Subcategories wrapper not found.')

        print(f'Category data collected: {{key: val.to_dict() for key, val in category_data.items()}}')

        with open('category.json', 'w', encoding='utf-8') as file:
            json.dump({key: val.to_dict() for key, val in category_data.items()}, file, ensure_ascii=False, indent=4)

        print('✅ Category data collection has been completed!')
    else:
        print('Fetching existing data from `category.json`...')

        with open('category.json', 'r', encoding='utf-8') as file:
            category_data = {key: Category(val['main'], val['sub']) for key, val in cast(dict[str, EmojiCategory], json.load(file)).items()}

            if not category_data:
                print('`category_data` is empty.')
                generate_emoji_category_data(True)

        print('✅ `category_data` is ready!')

def get_raw_emoji_data() -> dict[str, BasicEmojiInfo]:
    with open(RAW_EMOJI_JSON_FILE, 'r', encoding='utf-8') as file:
        return json.load(file)

def get_emoji_data_list() -> list[AdvanceEmojiInfo]:
    if not Path(EMOJI_JSON_FILE).exists():
        with open(EMOJI_JSON_FILE, 'w', encoding='utf-8') as file:
            file.write('{}')

    with open(EMOJI_JSON_FILE, 'r', encoding='utf-8') as file:
        return json.load(file)

def search(session: Session, slug: str) -> EmojiContent | None:
    url: str = f'{BASE_URL}{slug}'
    response: Response = session.get(url)

    if response.status_code == 200:
        soup: BeautifulSoup = BeautifulSoup(response.text, 'html.parser')
        # name = soup.find('h1').text.replace('Emoji Meaning', '').strip()
        # description = soup.find('p').text.strip()
        content_wrapper: Tag | None = soup.select_one('div[class^="EmojiContent_emoji-content-wrapper"]')
        # EmojiContent_emoji-content-alerts

        if content_wrapper is None:
            print("`Emoji Content Wrapper` not found.")
            return

        # Header contains emoji's name.
        title_header: Tag | None = content_wrapper.select_one('h1')
        descs_wrapper: Tag | None = content_wrapper.select_one('div.flex.flex-col.gap-3.text-left')
        name: str | None = title_header.get_text(strip=True).replace(' Emoji Meaning', '').strip() if title_header is not None else None
        alert: str | None = None
        descs: list[str] | None = []
        designs: list[EmojiDesign] = scrape_designs(url)

        if descs_wrapper is not None:
            alert_container = descs_wrapper.select_one('div[class^="EmojiContent_emoji-content-alerts"]')

            if alert_container is not None:
                alert = alert_container.get_text(strip=True)
                alert_container.decompose()

            for desc_container in descs_wrapper.select('div'):
                desc: str = desc_container.get_text(' ', strip=True).replace('\xa0', ' ')
                if desc not in descs:
                    descs.append(desc)
        else:
            descs = None

        if name is None and descs is None:
            print("Error: `name` and `descriptions` not found.")
        elif name is None:
            print(f"Error: `name` not found.\nDescriptions: {descs}.")
        elif descs is None:
            print(f"Name: {name}\nError: `descriptions` not found.")
        else:
            print(f'{name}:\n{'\n'.join([f'{i + 1}. {descs[i]}' for i in range(len(descs))])}')

        return EmojiContent(name, descs, alert, designs)
    else:
        print(f"Can't find `{slug}` in Emojipedia.")
        return

def retry_search_on_errors(session: Session, code: str, counter: int = 0) -> EmojiContent | None:
    content: EmojiContent | None = None

    match counter:
        case 0:
            content = search(session, code_2_slug(code))
        case 1:
            print(f'Try to search `{code}` as a flag...')
            content = search(session, f'flag-{code_2_slug(code)}')
        case 2:
            print(f'Try to search `{code}` with separator `_` replaces `-`...')
            content = search(session, code_2_slug(code).replace('-', '_'))
        case 3:
            print(f'Try to search `{code}` without `:` only...')
            content = search(session, code.replace(':', ''))
        case 4:
            # Bug from Emojipedia
            print(f'Try to search `{code}` with word `tonet` replaces `tone`.')
            content = search(session, code.replace(':', '').replace('tone', 'tonet'))
        case _:
            print(f"Error: Can't find `{code}` on Emojipedia.")
            return

    if content is None:
        time.sleep(random.uniform(1.0, 2.0))
        return retry_search_on_errors(session, code, counter + 1)
    else:
        return content

def render_progress_bar(ratio: float, max_value: int = 20) -> None:
    print(f'\nProgress: [{'|' * int(ratio * max_value)}{' ' * (max_value - int(ratio * max_value))}] {round(ratio * 100, 2)}%')

def scrape_and_save(session: Session, save_images: bool = False, start_from: str | None = None, resume: bool = False) -> None:
    raw_emoji_data: dict[str, BasicEmojiInfo] = get_raw_emoji_data()
    ori_raw_emoji_data_len: int = len(raw_emoji_data)
    # emoji_data_list: list[AdvanceEmojiInfo] = get_emoji_data_list() if resume else []
    emojis_processed: int = 0

    with open('emoji.jsonl', 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                emojis_processed += 1

    if isinstance(start_from, str):
        for emoji in list(raw_emoji_data.keys()): 
            if emoji != start_from:
                del raw_emoji_data[emoji]
            else:
                break

    for emoji, data in raw_emoji_data.items():
        # print(f'{'=' * 10}\n[{key}]', end=" ")
        print(f'{'=' * 10}\n{emoji}', end=" ")

        content: EmojiContent | None = retry_search_on_errors(session, data['en'])

        if save_images:
            download_images(data, content)
        else:
            new_data: AdvanceEmojiInfo = {
                'character': emoji,
                'name': content.name if content is not None else None,
                'description': content.descs if content is not None else None,
                'code': data['en'],
                'render_quality': data['status'], # Emoji render quality status
                'version': data['E'], # Emoji version
                'category': {
                    'main': category_data[emoji].main if emoji in category_data else None,
                    'sub': category_data[emoji].sub if emoji in category_data else None
                },
                'designs': content.designs if content is not None else None
            }

            if 'variant' in data:
                new_data['variant'] = data['variant']
            if 'alias' in data:
                new_data['alias'] = data['alias']
            if content is not None and content.alert is not None:
                new_data['alert'] = content.alert

            # emoji_data_list.append(new_data)

            with open(EMOJI_JSON_FILE, 'a', encoding='utf-8') as file:
                # json.dump(emoji_data_list, file, ensure_ascii=False, indent=4)
                json_string: str = json.dumps(new_data, ensure_ascii=False)

                file.write(json_string + '\n')

        emojis_processed += 1
        # render_progress_bar(len(emoji_data_list) / ori_raw_emoji_data_len)
        render_progress_bar(emojis_processed / ori_raw_emoji_data_len)
        print('=' * 10)

def resolve_errors(session: Session) -> None:
    raw_emoji_data: dict[str, BasicEmojiInfo] = get_raw_emoji_data()
    emoji_data_list: list[AdvanceEmojiInfo] = get_emoji_data_list()

    for emoji_data in emoji_data_list:
        if emoji_data['name'] is None or emoji_data['description'] is None or emoji_data['designs'] is None or len(emoji_data['designs']) == 0:
            emoji: str = emoji_data['character']
            content: EmojiContent | None = retry_search_on_errors(session, raw_emoji_data[emoji]['en'])

            emoji_data['name'] = content.name if content is not None else None
            emoji_data['description'] = content.descs if content is not None else None
            emoji_data['designs'] = content.designs if content is not None else None

    with open(EMOJI_JSON_FILE, 'w', encoding='utf-8') as file:
        json.dump(emoji_data_list, file, ensure_ascii=False, indent=4)

def download_emoji_designs_from_existing_emoji_info() -> None:
    with open(EMOJI_JSON_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                emoji_info: AdvanceEmojiInfo = json.loads(line)
                if emoji_info['designs'] is not None:
                    for design in emoji_info['designs']:
                        for timeline in design['timelines']:
                            if timeline['image_url'] == None:
                                print('Image URL Not Found!')
                                continue

                            print(f'Requests GET method on image URL: {timeline['image_url']}')
                            response: Response = requests.get(timeline['image_url'])

                            if (response.status_code == 200):
                                print('Image found!')

                                file_extension: str = timeline['image_url'].split('.')[-1]
                                IMAGE_PATH: str = f'designs/{emoji_info['code'].replace(':', '')}/{design['title'].replace('/', 'or')}/'

                                print(f'Image extension: {file_extension}')

                                print(f'Finding file path - `{IMAGE_PATH}`...')
                                if not Path(IMAGE_PATH).exists():
                                    print(f'File Path Not Found! Proceed creating file path...')
                                    Path(IMAGE_PATH).mkdir(parents=True, exist_ok=True)
                                    print(f'Created file path -`{IMAGE_PATH}`...')

                                with open(f'{IMAGE_PATH}{timeline['date'].replace('/', '-')}-{timeline['version']}.{file_extension}', 'wb') as file:
                                    print('Writing image content...')
                                    file.write(response.content)
                                    print('Writing completed ✅.')
                            else:
                                print(f'Image not found with status code {response}!')
                else:
                    print('Emoji Content or Designs Not Found!')

def download_images(data: BasicEmojiInfo, content: EmojiContent | None) -> None:
    if content is not None and content.designs is not None:
        for design in content.designs:
            for timeline in design['timelines']:
                if timeline['image_url'] == None:
                    print('Image URL Not Found!')
                    continue

                print(f'Requests GET method on image URL: {timeline['image_url']}')
                response: Response = requests.get(timeline['image_url'])

                if (response.status_code == 200):
                    print('Image found!')

                    file_extension: str = timeline['image_url'].split('.')[-1]
                    IMAGE_PATH: str = f'designs/{data['en'].replace(':', '')}/{design['title'].replace('/', 'or')}/'

                    print(f'Image extension: {file_extension}')

                    print(f'Finding file path - `{IMAGE_PATH}`...')
                    if not Path(IMAGE_PATH).exists():
                        print(f'File Path Not Found! Proceed creating file path...')
                        Path(IMAGE_PATH).mkdir(parents=True, exist_ok=True)
                        print(f'Created file path -`{IMAGE_PATH}`...')

                    with open(f'{IMAGE_PATH}{timeline['date'].replace('/', '-')}-{timeline['version']}.{file_extension}', 'wb') as file:
                        print(f'Writing image content...')
                        file.write(response.content)
                        print('Writing completed ✅.')
                else:
                    print(f'Image not found with status code {response}!')
    else:
        print('Emoji Content or Designs Not Found!')

if __name__ == '__main__':
    session: Session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    session.headers.update(HEADERS)

    download_emoji_designs_from_existing_emoji_info()
    # generate_emoji_category_data()
    # scrape_and_save(session, False, '👼')
    # resolve_errors(session)