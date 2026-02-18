#include <napi.h>

#include <fcntl.h>
#include <io.h>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

using namespace std;

struct RGBA
{
    uint8_t r, g, b, a;

    RGBA() : r(0), g(0), b(0), a(255) {}
    RGBA(uint8_t _r, uint8_t _g, uint8_t _b) : r(_r), g(_g), b(_b), a(255) {}
    RGBA(uint8_t _r, uint8_t _g, uint8_t _b, uint8_t _a) : r(_r), g(_g), b(_b), a(_a) {}
    // RGBA(RGB *other) : r(other->r), g(other->g), b(other->b), a(255) {}
};

struct RGB
{
    uint8_t r, g, b;

    RGB() : r(0), g(0), b(0) {}
    RGB(uint8_t _r, uint8_t _g, uint8_t _b) : r(_r), g(_g), b(_b) {}
    RGB(RGBA other) : r(other.r), g(other.g), b(other.b) {}
};

class Img
{
public:
    unsigned int width;
    unsigned int height;
    vector<RGBA> pixels;

    Img(const unsigned int w, const unsigned int h, const RGBA& color = { 0, 0, 0 }) : width(w), height(h) {
        pixels.resize(width * height, color);
    }

    Img(const char *path) {
        int w, h, c;

        unsigned char* data = stbi_load(path, &w, &h, &c, 4);

        if (data == nullptr)
            return;

        width = w;
        height = h;
        pixels.resize(width * height);

        for (unsigned int i = 0; i < width * height; ++i)
        {
            pixels[i].r = data[i * 4 + 0];
            pixels[i].g = data[i * 4 + 1];
            pixels[i].b = data[i * 4 + 2];
            pixels[i].a = data[i * 4 + 3];
        }

        stbi_image_free(data);
    }

    void draw_rect(const unsigned int x1, const unsigned int y1, const unsigned int x2, const unsigned int y2, const RGBA& color)
    {
        for (unsigned int y = y1; y <= y2; ++y)
            for (unsigned int x = x1; x <= x2; ++x)
                pixels[y * width + x] = color;
    }

    void save_png(const char* filename)
    {
        stbi_write_png(filename, width, height, 4, pixels.data(), width * 4);
    }

    void save_jpg(const char* filename, const unsigned int quality = 100)
    {
        stbi_write_jpg(filename, width, height, 4, pixels.data(), quality);
    }

    void overlay(const Img& img, unsigned int x, unsigned int y)
    {
        for (unsigned int sy = 0; sy < img.height; ++sy)
        {
            for (unsigned int sx = 0; sx < img.width; ++sx)
            {
                unsigned int dest_x = x + sx;
                unsigned int dest_y = y + sy;

                if (dest_x >= width || dest_y >= height) continue;

                unsigned int src_idx = sy * img.width + sx;
                unsigned int dest_idx = dest_y * width + dest_x;

                uint8_t pixel_alpha = img.pixels[src_idx].a;

                switch (pixel_alpha) {
                    case 0:
                        continue;
                    case 255:
                        pixels[dest_idx] = img.pixels[src_idx];
                        continue;
                }

                uint8_t a = pixel_alpha;
                uint8_t inv_a = 255 - a;

                uint8_t r = (img.pixels[src_idx].r * a + pixels[dest_idx].r * inv_a) >> 8;
                uint8_t g = (img.pixels[src_idx].g * a + pixels[dest_idx].g * inv_a) >> 8;
                uint8_t b = (img.pixels[src_idx].b * a + pixels[dest_idx].b * inv_a) >> 8;

                pixels[dest_idx] = RGBA(r, g, b);
            }
        }
    }

    void write_to_std_out()
    {
        int len;

        unsigned char* png_data = stbi_write_png_to_mem(
            (unsigned char*)pixels.data(),
            width * 4,
            width,
            height,
            4,
            &len
        );

        if (png_data == NULL)
            return;

        #ifdef _WIN32
        _setmode(_fileno(stdout), _O_BINARY);
        #endif

        fwrite(png_data, 1, len, stdout);
        free(png_data);
    }
};

const size_t PIXELS_PER_SIDE = 60;
const size_t SQUARES_PER_SIDE = 8;
Img* sprite_cache[12] = { nullptr };
Img img(480, 480, { 255, 255, 255 } );

Napi::Value Init(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    string base_path = info[0].As<Napi::String>().Utf8Value();

    for (size_t y = 0; y < 8; ++y)
    {
        for (size_t x = 0; x < 8; ++x)
        {
            size_t x1 = x * PIXELS_PER_SIDE;
            size_t y1 = y * PIXELS_PER_SIDE;

            if ((x + y) % 2 != 0)
                img.draw_rect(x1, y1, x1 + PIXELS_PER_SIDE - 1, y1 + PIXELS_PER_SIDE - 1, { 128, 128, 128 });
        }
    }

    for (int i = 0; i < 12; ++i)
    {
        if (sprite_cache[i] == nullptr)
        {
            char sprite_path[512];
            
            snprintf(sprite_path, sizeof(sprite_path), "%s/%d.png", base_path.c_str(), i);
            sprite_cache[i] = new Img(sprite_path);
        }
    }

    return env.Undefined();
}

Napi::Value Render(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::Array pieces = info[0].As<Napi::Array>();
    Img current_frame = img;

    for (size_t i = 0; i < pieces.Length(); ++i)
    {
        Napi::Value val = pieces.Get(i);
        string piece = val.As<Napi::String>().Utf8Value();
        int x, y, id;

        sscanf(piece.c_str(), "%d,%d:%d", &x, &y, &id);

        current_frame.overlay(*sprite_cache[id], x * PIXELS_PER_SIDE, y * PIXELS_PER_SIDE);
    }

    int len;

    unsigned char* png_data = stbi_write_png_to_mem(
        (unsigned char*)current_frame.pixels.data(),
        current_frame.width * 4,
        current_frame.width,
        current_frame.height,
        4,
        &len
    );

    Napi::Buffer<uint8_t> result = Napi::Buffer<uint8_t>::Copy(env, png_data, len);

    STBIW_FREE(png_data);

    return result;
}

Napi::Object Main(Napi::Env env, Napi::Object exports)
{
    exports.Set("init", Napi::Function::New(env, Init));
    exports.Set("render", Napi::Function::New(env, Render));

    return exports;
}

NODE_API_MODULE(App, Main);