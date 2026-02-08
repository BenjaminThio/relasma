#include <iostream>
#include <fstream>
#include <string>
#include <filesystem>
using namespace std;

const char* DICTIONARY_FILE_PATH = "enwiktionary-latest-pages-articles.xml";
const char* WORDS_FILE_PATH = "words_alpha.txt";

void read_file(const char* FILE_PATH);

int main() {
    read_file(DICTIONARY_FILE_PATH);

    return 0;
}

void read_file(const char* file_path) {
    ifstream file(file_path);

    if (filesystem::exists(file_path))
    {
        if (file.is_open())
        {
            string line = "";

            while (getline(file, line))
            {
                cout << line << endl;
            }
        }
        else
            cout << "Failed to open file `" << file_path << "`.";
    }
    else
        cout << "File `" << file_path << "` not found.";
}