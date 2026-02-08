import { type CallbackQueryContext, type CommandContext, Context, InlineKeyboard, Composer } from "grammy";
import { type SnakeGameData, createNewSnakeGame, deleteSnakeDoc, getSnakeGameData, updateSnakeGame, userExists } from "./database";
import { Movement, Coord, contains, Callbacks } from "../types";

const snakeModule = new Composer();
const HEIGHT: number = 10;
const WIDTH: number = 10;
const BACKGROUND: string = "⬜️";
const BARRIER: string = "🟨";
const HEAD: string = "😳";
const BODY: string = "🟡";
const FOOD: string = "🍎";
const KEYBOARD: InlineKeyboard = new InlineKeyboard()
    .text("⬆️", `${Callbacks.SNAKE} ${Movement.UP}`).row()
    .text("⬅️", `${Callbacks.SNAKE} ${Movement.LEFT}`).text("🔄", `${Callbacks.SNAKE} 4`).text("➡️", `${Callbacks.SNAKE} ${Movement.RIGHT}`).row()
    .text("⬇️", `${Callbacks.SNAKE} ${Movement.DOWN}`);
const games: Record<number, SnakeGameData> = {};
const getHead = (userId: number) => games[userId].parts[0];
const getBody = (userId: number) => games[userId].parts.slice(1);

snakeModule.command("snake", async (ctx: CommandContext<Context>): Promise<void> => {
    if (!ctx.from) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }

    const userId: number = ctx.from.id;

    if (!(userId in games)) {
        if (await userExists(userId)) {
            games[userId] = await getSnakeGameData(userId);
        } else {
            games[userId] = {
                parts: [],
                foodCoord: new Coord(0, 0),
            };
            games[userId].parts = [new Coord(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT))];
            generateFood(userId);
            await createNewSnakeGame(userId, games[userId]);
        }
    }
    await ctx.reply(renderMap(userId), {reply_markup: KEYBOARD});
})

snakeModule.callbackQuery(new RegExp(`^${Callbacks.SNAKE} ([0-3])$`), async (ctx: CallbackQueryContext<Context>): Promise<void> => {
    const direction: Movement = Number(ctx.match[1]);

    switch (direction) {
        case Movement.UP:
            await move(ctx, 0, -1);
            break;
        case Movement.LEFT:
            await move(ctx, -1, 0);
            break;
        case Movement.DOWN:
            await move(ctx, 0, 1);
            break;
        case Movement.RIGHT:
            await move(ctx, 1, 0);
    }
})

async function move(ctx: CallbackQueryContext<Context>, x: number, y: number) {
    if (!ctx.from) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }

    const userId: number = ctx.from.id;

    if (x < 0 || x > 0) {
        if (getHead(userId).x + x >= 0 && getHead(userId).x + x < WIDTH)
            games[userId].parts.splice(0, 0, new Coord(getHead(userId).x + x, getHead(userId).y));
        else if (getHead(userId).x + x >= 0)
            games[userId].parts.splice(0, 0, new Coord(0, getHead(userId).y));
        else
            games[userId].parts.splice(0, 0, new Coord(WIDTH - 1, getHead(userId).y));
    }

    if (y < 0 || y > 0) {
        if (getHead(userId).y + y >= 0 && getHead(userId).y + y < HEIGHT)
            games[userId].parts.splice(0, 0, new Coord(getHead(userId).x, getHead(userId).y + y));
        else if (getHead(userId).y + y >= 0)
            games[userId].parts.splice(0, 0, new Coord(getHead(userId).x, 0));
        else
            games[userId].parts.splice(0, 0, new Coord(getHead(userId).x, HEIGHT - 1));
    }

    ctx.answerCallbackQuery();

    if (getHead(userId).equals(games[userId].foodCoord)) {
        if (generateFood(userId) === 0) {
            await ctx.editMessageText(`<b>Game Over!</b>\n${renderMap(userId)}`, { parse_mode: "HTML" });
            await deleteSnakeDoc(userId);
            delete games[userId];
            return;
        }
    } else if (contains(getBody(userId), getHead(userId))) {
        await ctx.editMessageText(`<b>Game Over!\nScore: ${games[userId].parts.length - 1}</b>\n${renderMap(userId)}`, { parse_mode: "HTML" });
        await deleteSnakeDoc(userId);
        delete games[userId];
        return;
    } else
        games[userId].parts.pop();

    await updateSnakeGame(userId, games[userId]);
    await ctx.editMessageText(renderMap(userId), {reply_markup: KEYBOARD});
}

function renderMap(userId: number): string {
    let renderer: string = "";

    renderer += `${BARRIER.repeat(WIDTH + 2)}\n${BARRIER}`;
    for (let y: number = 0; y < HEIGHT; y++) {
        for (let x: number = 0; x < WIDTH; x++) {
            if (getHead(userId).equals(new Coord(x, y)))
                renderer += HEAD;
            else if (contains(games[userId].parts, x, y))
                renderer += BODY;
            else if (games[userId].foodCoord.equals(new Coord(x, y)))
                renderer += FOOD;
            else
                renderer += BACKGROUND;
        }
        renderer += `${BARRIER}\n${BARRIER}`;
    }
    renderer += BARRIER.repeat(WIDTH + 1);

    return renderer;
}

function generateFood(userId: number): number {
    const availableCoords: Coord[] = [];

    for (let y: number = 0; y < HEIGHT; y++) {
        for (let x: number = 0; x < WIDTH; x++) {
            if (!contains(games[userId].parts, x, y)) {
                availableCoords.push(new Coord(x, y));
            }
        }
    }

    switch (availableCoords.length) {
        case 0:
            break;
        default:
            games[userId].foodCoord = availableCoords[Math.floor(Math.random() * availableCoords.length)]; // randomCoord
    }

    return availableCoords.length;
}

export default snakeModule;