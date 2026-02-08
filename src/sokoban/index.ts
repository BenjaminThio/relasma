import { type CallbackQueryContext, type CommandContext, Composer, Context, InlineKeyboard } from "grammy";
import { Callbacks, contains, Coord, Movement } from "../types";
import { type SokobanGameData, createNewSokobanGame, deleteSokobanDoc, getSokobanGameData, updateSokobanGame, userExists } from "./database";

const sokobanModule = new Composer();
const HEIGHT: number = 5;
const WIDTH: number = 7;
const BACKGROUND: string = "⬜️";
const BARRIER: string = "🟪";
const PLAYER: string = "🥹";
const BOX: string = "📦";
const DESTINATION: string = "❌";
const KEYBOARD: InlineKeyboard = new InlineKeyboard()
    .text("⬆️", `${Callbacks.SOKOBAN} 0`).row()
    .text("⬅️", `${Callbacks.SOKOBAN} 1`).text("🔄", `${Callbacks.SOKOBAN} 4`).text("➡️", `${Callbacks.SOKOBAN} 3`).row()
    .text("⬇️", `${Callbacks.SOKOBAN} 2`);

const games: Record<string, SokobanGameData> = {};

sokobanModule.command("sokoban", async (ctx: CommandContext<Context>): Promise<void> => {
    if (ctx.from === undefined) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }

    if (!(ctx.from.id in games)) {
        if (await userExists(ctx.from.id)) {
            games[ctx.from.id] = await getSokobanGameData(ctx.from.id);
        } else {
            games[ctx.from.id] = {
                player: new Coord(0, 0),
                boxes: [],
                destinations: [],
                barriers: []
            };

            reshuffle(ctx.from.id);
            createNewSokobanGame(ctx.from.id, games[ctx.from.id]);
        }
    }
    ctx.reply(renderMap(ctx.from.id), { reply_markup: KEYBOARD });
})

sokobanModule.callbackQuery(new RegExp(`^${Callbacks.SOKOBAN} ([0-3])$`), async (ctx: CallbackQueryContext<Context>): Promise<void> => {
    if (ctx.from === undefined) {
        ctx.editMessageText("`ctx.from` is undefined.");
        return;
    } 

    const direction: Movement = parseInt((ctx.match as RegExpMatchArray)[1] as string);

    switch (direction) {
        case Movement.UP:
            movePlayer(ctx.from.id, 0, -1);
            break;
        case Movement.LEFT:
            movePlayer(ctx.from.id, -1, 0);
            break;
        case Movement.DOWN:
            movePlayer(ctx.from.id, 0, 1);
            break;
        case Movement.RIGHT:
            movePlayer(ctx.from.id, 1, 0);
    }

    ctx.answerCallbackQuery();

    if (gameOver(ctx.from.id)) {
        await ctx.editMessageText(`<b>Game Over!</b>\n${renderMap(ctx.from.id)}`, { parse_mode: "HTML" });
        await deleteSokobanDoc(ctx.from.id);
        return;
    }

    await updateSokobanGame(ctx.from.id, games[ctx.from.id]);
    await ctx.editMessageText(renderMap(ctx.from.id), { reply_markup: KEYBOARD });
})

function reshuffle(userId: number): void {
    const availableCoords: Coord[] = [];

    for (let y: number = 0; y < HEIGHT; y++) {
        for (let x: number = 0; x < WIDTH; x++) {
            availableCoords.push(new Coord(x, y));
        }
    }

    for (let i: number = 0; i < 3; i++) {
        const randomBoxIndex: number = Math.floor(Math.random() * availableCoords.length);

        games[userId].boxes.push(availableCoords[randomBoxIndex]);
        availableCoords.splice(randomBoxIndex, 1);

        const randomDstIndex: number = Math.floor(Math.random() * availableCoords.length);

        games[userId].destinations.push(availableCoords[randomDstIndex]);
        availableCoords.splice(randomDstIndex, 1);

        const randomBarrierIndex: number = Math.floor(Math.random() * availableCoords.length);

        games[userId].barriers.push(availableCoords[randomBarrierIndex]);
        availableCoords.splice(randomBarrierIndex, 1);
    }

    games[userId].player = availableCoords[Math.floor(Math.random() * availableCoords.length)];
}

function movePlayer(userId: number, x: number, y: number): void {
    let xCoord = games[userId].player.x;
    let yCoord = games[userId].player.y;

    if (xCoord + x >= 0 && xCoord + x < WIDTH)
        xCoord += x;
    else if (xCoord + x < 0)
        xCoord = WIDTH - 1;
    else
        xCoord = 0;

    if (yCoord + y >= 0 && yCoord + y < HEIGHT)
        yCoord += y;
    else if (yCoord + y < 0)
        yCoord = HEIGHT - 1;
    else
        yCoord = 0;

    if (contains(games[userId].destinations, xCoord, yCoord) || contains(games[userId].barriers, xCoord, yCoord))
        return;
    else if (contains(games[userId].boxes, xCoord, yCoord)) {
        const boxIndex = games[userId].boxes.findIndex((coord: Coord) => coord.x === xCoord && coord.y === yCoord);
        const newBoxPos = moveBox(userId, boxIndex, x, y);

        if (newBoxPos) {
            games[userId].boxes[boxIndex] = newBoxPos;
        } else {
            return;
        }
    }
    games[userId].player = new Coord(xCoord, yCoord);
}

const gameOver = (userId: number): boolean =>
    games[userId].boxes.every((boxCoord: Coord) =>
            contains(games[userId].destinations, boxCoord));

function moveBox(userId: number, boxIndex: number, x: number, y: number): Coord | undefined {
    // console.log(boxes[boxIndex]);
    let xCoord: number = games[userId].boxes[boxIndex].x;
    let yCoord: number = games[userId].boxes[boxIndex].y;

    if (xCoord + x >= 0 && xCoord + x < WIDTH)
        xCoord += x;
    else if (xCoord + x < 0)
        xCoord = WIDTH - 1;
    else
        xCoord = 0;

    if (yCoord + y >= 0 && yCoord + y < HEIGHT)
        yCoord += y;
    else if (yCoord + y < 0)
        yCoord = HEIGHT - 1;
    else
        yCoord = 0;

    if (contains(games[userId].boxes, xCoord, yCoord) || contains(games[userId].barriers, xCoord, yCoord))
        return;
    else
        return new Coord(xCoord, yCoord);
}

function renderMap(userId: number): string {
    let renderer: string = "";

    renderer += `${BARRIER.repeat(WIDTH + 2)}\n${BARRIER}`;
    for (let y: number = 0; y < HEIGHT; y++) {
        for (let x: number = 0; x < WIDTH; x++) {
            if (games[userId].player.equals(new Coord(x, y)))
                renderer += PLAYER;
            else if (contains(games[userId].barriers, x, y) ||
                    contains(games[userId].boxes, x, y) &&
                    contains(games[userId].destinations, x, y)
                )
                renderer += BARRIER;
            else if (contains(games[userId].boxes, x, y))
                renderer += BOX;
            else if (contains(games[userId].destinations, x, y))
                renderer += DESTINATION;
            else
                renderer += BACKGROUND;
        }
        renderer += `${BARRIER}\n${BARRIER}`;
    }
    renderer += `${BARRIER.repeat(WIDTH + 1)}`;

    return renderer;
}

export default sokobanModule;