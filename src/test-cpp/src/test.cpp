#include <iostream>
#include "CImg.h"
using namespace std;
using namespace cimg_library;

const int HEIGHT = 500;
const int LENGTH = 500;

int main()
{
    CImg<unsigned char*> img(LENGTH, HEIGHT, 1, 3, 0);
    img.save("test.jpg");
    return 0;
}