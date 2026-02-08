import time

DICTIONARY_FILE_PATH = 'enwiktionary-latest-pages-articles.xml'
WORDS_FILE_PATH = 'words_alpha.txt'

def read_file(file_path: str) -> None:
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            print(line)

if __name__ == '__main__':
    print('This is Python.')
    time.sleep(5)
    read_file(DICTIONARY_FILE_PATH)
