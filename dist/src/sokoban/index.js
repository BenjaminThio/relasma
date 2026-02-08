import { Composer, InlineKeyboard } from "grammy";
import { Callbacks, contains, Coord, Movement } from "../types.js";
import { createNewSokobanGame, deleteSokobanDoc, getSokobanGameData, updateSokobanGame, userExists } from "./database.js";
const sokobanModule = new Composer();
const HEIGHT = 5;
const WIDTH = 7;
const BACKGROUND = "⬜️";
const BARRIER = "🟪";
const PLAYER = "🥹";
const BOX = "📦";
const DESTINATION = "❌";
const KEYBOARD = new InlineKeyboard()
    .text("⬆️", `${Callbacks.SOKOBAN} 0`).row()
    .text("⬅️", `${Callbacks.SOKOBAN} 1`).text("🔄", `${Callbacks.SOKOBAN} 4`).text("➡️", `${Callbacks.SOKOBAN} 3`).row()
    .text("⬇️", `${Callbacks.SOKOBAN} 2`);
const games = {};
const getGame = (userId) => {
    const game = games[userId];
    if (game !== undefined)
        return game;
    else
        throw new Error(`Game not found.`);
};
sokobanModule.command("sokoban", async (ctx) => {
    if (ctx.from === undefined) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }
    if (!(ctx.from.id in games)) {
        if (await userExists(ctx.from.id)) {
            games[ctx.from.id] = await getSokobanGameData(ctx.from.id);
        }
        else {
            games[ctx.from.id] = {
                player: new Coord(0, 0),
                boxes: [],
                destinations: [],
                barriers: []
            };
            reshuffle(ctx.from.id);
            createNewSokobanGame(ctx.from.id, getGame(ctx.from.id));
        }
    }
    ctx.reply(renderMap(ctx.from.id), { reply_markup: KEYBOARD });
});
sokobanModule.callbackQuery(new RegExp(`^${Callbacks.SOKOBAN} ([0-3])$`), async (ctx) => {
    if (ctx.from === undefined) {
        ctx.editMessageText("`ctx.from` is undefined.");
        return;
    }
    const direction = parseInt(ctx.match[1]);
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
    await updateSokobanGame(ctx.from.id, getGame(ctx.from.id));
    await ctx.editMessageText(renderMap(ctx.from.id), { reply_markup: KEYBOARD });
});
function reshuffle(userId) {
    const availableCoords = [];
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            availableCoords.push(new Coord(x, y));
        }
    }
    for (let i = 0; i < 3; i++) {
        const randomBoxIndex = Math.floor(Math.random() * availableCoords.length);
        getGame(userId).boxes.push(availableCoords[randomBoxIndex]);
        availableCoords.splice(randomBoxIndex, 1);
        const randomDstIndex = Math.floor(Math.random() * availableCoords.length);
        getGame(userId).destinations.push(availableCoords[randomDstIndex]);
        availableCoords.splice(randomDstIndex, 1);
        const randomBarrierIndex = Math.floor(Math.random() * availableCoords.length);
        getGame(userId).barriers.push(availableCoords[randomBarrierIndex]);
        availableCoords.splice(randomBarrierIndex, 1);
    }
    getGame(userId).player = availableCoords[Math.floor(Math.random() * availableCoords.length)];
}
function movePlayer(userId, x, y) {
    let xCoord = getGame(userId).player.x;
    let yCoord = getGame(userId).player.y;
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
    if (contains(getGame(userId).destinations, xCoord, yCoord) || contains(getGame(userId).barriers, xCoord, yCoord))
        return;
    else if (contains(getGame(userId).boxes, xCoord, yCoord)) {
        const boxIndex = getGame(userId).boxes.findIndex((coord) => coord.x === xCoord && coord.y === yCoord);
        const newBoxPos = moveBox(userId, boxIndex, x, y);
        if (newBoxPos) {
            getGame(userId).boxes[boxIndex] = newBoxPos;
        }
        else {
            return;
        }
    }
    getGame(userId).player = new Coord(xCoord, yCoord);
}
const gameOver = (userId) => getGame(userId).boxes.every((boxCoord) => contains(getGame(userId).destinations, boxCoord));
function moveBox(userId, boxIndex, x, y) {
    // console.log(boxes[boxIndex]);
    let xCoord = getGame(userId).boxes[boxIndex].x;
    let yCoord = getGame(userId).boxes[boxIndex].y;
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
    if (contains(getGame(userId).boxes, xCoord, yCoord) || contains(getGame(userId).barriers, xCoord, yCoord))
        return;
    else
        return new Coord(xCoord, yCoord);
}
function renderMap(userId) {
    let renderer = "";
    renderer += `${BARRIER.repeat(WIDTH + 2)}\n${BARRIER}`;
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (getGame(userId).player.equals(new Coord(x, y)))
                renderer += PLAYER;
            else if (contains(getGame(userId).barriers, x, y) ||
                contains(getGame(userId).boxes, x, y) &&
                    contains(getGame(userId).destinations, x, y))
                renderer += BARRIER;
            else if (contains(getGame(userId).boxes, x, y))
                renderer += BOX;
            else if (contains(getGame(userId).destinations, x, y))
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
