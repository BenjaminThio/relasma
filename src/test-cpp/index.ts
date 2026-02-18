import { Composer, InputFile } from "grammy";
import { createRequire } from "node:module";
import path from "node:path";
import { Position, Piece } from "../chess/index.js";

const module = new Composer();

const require = createRequire(import.meta.url);
const chessEngine = require("./build/App.node");

chessEngine.init(path.join(import.meta.dir, "sprites"));

export function generateImage(input: Record<Position, Piece>): Promise<Buffer>
{
    const boardArgs = Object.entries(input).map(([pos, piece_id]: [string, Piece]) => `${pos}:${piece_id}`);
    console.time("C++ Render");
    const imageBuffer = chessEngine.render(boardArgs);
    console.timeEnd("C++ Render");

    return imageBuffer;
}

/*
import { spawn } from "node:child_process";
import { Composer, InputFile } from "grammy";
import path from "node:path";
import { Position, Piece } from "../chess/index.js";

const module = new Composer();

export function generateImage(input: Record<Position, Piece>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // const spritePath: string = path.join(__dirname, "sprites");
        const worker = spawn(path.join(__dirname, "./App.exe") ,[spritePath, ...Object.entries(input).map(([pos, piece_id]: [string, Piece]) => `${pos}:${piece_id}`)]);

        let err = "";
        const chunks: Buffer[] = [];

        worker.stderr.on("data", (d) => (err += d.toString("utf8")));
        worker.stdout.on("data", (d) => chunks.push(d));

        worker.on("error", reject);
        worker.on("close", (code) => {
            if (code !== 0) return reject("TEST");
            resolve(Buffer.concat(chunks));
        });

        worker.stdin.write(JSON.stringify(input));
        worker.stdin.end();
    });
}

import { Composer, InputFile } from "grammy";
import sharp, { OverlayOptions } from "sharp";
import { Position, Piece } from "../chess/index.js";
import path from "node:path";

const module = new Composer();
let rects: string = "";

for (let y: number = 0; y < 8; y++)
    for (let x: number = 0; x < 8; x++)
        if ((x + y) % 2 != 0)
            rects += `<rect x="${x * 60}" y="${y * 60}" width="60" height="60" fill="gray"></rect>`;

const STATIC_BOARD_BUFFER: Buffer<ArrayBuffer> = Buffer.from(`<svg width="480" height="480">${rects}</svg>`);
const PRE_BACKED_BOARD: Buffer<ArrayBufferLike> = await sharp({
    create: {
        width: 480, height: 480, channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
}).composite([{ input: STATIC_BOARD_BUFFER, top: 0, left: 0 }]).jpeg().toBuffer();

const SPRITE_CACHE: Uint8Array<ArrayBuffer>[] = [];

for (let i: number = 0; i < 12; i++)
{
    SPRITE_CACHE.push(await Bun.file(path.join(__dirname, `sprites/${i}.png`)).bytes());
}

export async function generateImage(board: Record<Position, Piece>): Promise<Buffer>
{
    return await sharp(PRE_BACKED_BOARD)
    .composite([
    ...Object.entries(board).map(([pos, piece_id]: [string, Piece]) => ({
        input: SPRITE_CACHE[piece_id],
        top: Number(pos[2]) * 60,
        left: Number(pos[0]) * 60
    }) as OverlayOptions)])
    .jpeg()
    .toBuffer();
}
*/
module.command("test_cpp", async (ctx) => {
    console.time("IN");
    const imgBuffer: Buffer<ArrayBufferLike> = await generateImage({ "0,0": 0 } as Record<Position, Piece>);
    console.timeEnd("IN");

    await ctx.replyWithPhoto(new InputFile(imgBuffer, "board.png"));
});

export default module;