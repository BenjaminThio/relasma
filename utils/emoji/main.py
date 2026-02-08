import json
import requests
from requests import Response
from bs4 import BeautifulSoup, Tag
from typing import NotRequired, TypedDict, cast

from advance_scraper import fetch_rendered_html

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

    def __init__(self, name: str | None, descs: list[str] | None, alert: str | None) -> None:
        self.name = name
        self.descs = descs
        self.alert = alert

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
                                # c is not None
                                any(cls.startswith('Link_link-wrapper') for cls in c.split(' '))
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
    with open('raw_emoji.json', 'r', encoding='utf-8') as file:
        return json.load(file)

def get_emoji_data_list() -> list[AdvanceEmojiInfo]:
    with open('emoji.json', 'r', encoding='utf-8') as file:
        return json.load(file)

def search(slug: str) -> EmojiContent | None:
    url: str = f'{BASE_URL}{slug}'
    response: Response = requests.get(url, headers=HEADERS)

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

        return EmojiContent(name, descs, alert)
    else:
        print(f"Can't find `{slug}` in Emojipedia.")
        return

def retry_search_on_errors(code: str, counter: int = 0) -> EmojiContent | None:
    content: EmojiContent | None = None

    match counter:
        case 0:
            content = search(code_2_slug(code))
        case 1:
            print(f'Try to search `{code}` as a flag...')
            content = search(f'flag-{code_2_slug(code)}')
        case 2:
            print(f'Try to search `{code}` with separator `_` replaces `-`...')
            content = search(code_2_slug(code).replace('-', '_'))
        case 3:
            print(f'Try to search `{code}` without `:` only...')
            content = search(code.replace(':', ''))
        case 4:
            # Bug from Emojipedia
            print(f'Try to search `{code}` with word `tonet` replaces `tone`.')
            content = search(code.replace(':', '').replace('tone', 'tonet'))
        case _:
            print(f"Error: Can't find `{code}` on Emojipedia.")
            return

    if content is None:
        return retry_search_on_errors(code, counter + 1)
    else:
        return content

def render_progress_bar(ratio: float, max_value: int = 20) -> None:
    print(f'\nProgress: [{'|' * int(ratio * max_value)}{' ' * (max_value - int(ratio * max_value))}] {round(ratio * 100, 2)}%')

def scrape_and_save(start_from: str | None = None, resume: bool = False) -> None:
    raw_emoji_data: dict[str, BasicEmojiInfo] = get_raw_emoji_data()
    ori_raw_emoji_data_len: int = len(raw_emoji_data)
    emoji_data_list: list[AdvanceEmojiInfo] = get_emoji_data_list() if resume else []

    if isinstance(start_from, str):
        for emoji in list(raw_emoji_data.keys()): 
            if emoji != start_from:
                del raw_emoji_data[emoji]
            else:
                break

    for emoji, data in raw_emoji_data.items():
        # print(f'{'=' * 10}\n[{key}]', end=" ")
        print(f'{'=' * 10}\n{emoji}', end=" ")

        content: EmojiContent | None = retry_search_on_errors(data['en'])
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
            }
        }

        if 'variant' in data:
            new_data['variant'] = data['variant']
        if 'alias' in data:
            new_data['alias'] = data['alias']
        if content is not None and content.alert is not None:
            new_data['alert'] = content.alert

        emoji_data_list.append(new_data)

        with open('emoji.json', 'w', encoding='utf-8') as file:
            json.dump(emoji_data_list, file, ensure_ascii=False, indent=4)

        render_progress_bar(len(emoji_data_list) / ori_raw_emoji_data_len)
        print('=' * 10)

def resolve_errors() -> None:
    raw_emoji_data: dict[str, BasicEmojiInfo] = get_raw_emoji_data()
    emoji_data_list: list[AdvanceEmojiInfo] = get_emoji_data_list()

    for emoji_data in emoji_data_list:
        if emoji_data['name'] is None or emoji_data['description'] is None:
            emoji: str = emoji_data['character']
            content: EmojiContent | None = retry_search_on_errors(raw_emoji_data[emoji]['en'])

            emoji_data['name'] = content.name if content is not None else None
            emoji_data['description'] = content.descs if content is not None else None

    with open('emoji.json', 'w', encoding='utf-8') as file:
        json.dump(emoji_data_list, file, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    # generate_emoji_category_data()
    # scrape_and_save()
    resolve_errors()