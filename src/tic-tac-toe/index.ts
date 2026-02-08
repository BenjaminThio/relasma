import { type CallbackQueryContext, type CommandContext, Composer, Context, InlineKeyboard } from "grammy";
import { Callbacks } from "../types";
import { type TicTacToeData, createNewTicTacToe, deleteTicTacToeDoc, getTicTacToeData, updateTicTacToe, userExists } from "./database";

const ticTacToeModule: Composer<Context> = new Composer();
const MARKS: string[] = ["❌", "⭕️"];
const games: Record<string, TicTacToeData> = {};

ticTacToeModule.command("tictactoe", async (ctx: CommandContext<Context>): Promise<void> => {
    if (ctx.from === undefined) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }

    if (!(ctx.from.id in games)) {
        if (await userExists(ctx.from.id)) {
            games[ctx.from.id] = await getTicTacToeData(ctx.from.id);
        } else {
            games[ctx.from.id] = {
                board: new Array(9).fill(null),
                player: false
            };

            createNewTicTacToe(ctx.from.id, games[ctx.from.id]);
        }
    }
    ctx.reply("Tic Tac Toe", { reply_markup: renderKeyboard(ctx.from.id) });
});

ticTacToeModule.callbackQuery(new RegExp(`^${Callbacks.TIC_TAC_TOE} ([0-8])$`), async (ctx: CallbackQueryContext<Context>): Promise<void> => {
    const idx: number = parseInt(ctx.match[1]);

    ctx.answerCallbackQuery();

    switch (games[ctx.from.id].board[idx]) {
        case null:
            games[ctx.from.id].board[idx] = games[ctx.from.id].player;
            if (gameOver(ctx.from.id)) {
                await ctx.editMessageText(`Tic Tac Toe\nGame Over! Player \`${+games[ctx.from.id].player + 1}\` wins.`, { reply_markup: renderKeyboard(ctx.from.id), parse_mode: "Markdown" });
                await deleteTicTacToeDoc(ctx.from.id);
                delete games[ctx.from.id];
                return;
            } else if (!games[ctx.from.id].board.some((mark: (boolean | null)) => mark === null)) {
                await ctx.editMessageText(`Tic Tac Toe\nGame Over! It's a tie.`, { reply_markup: renderKeyboard(ctx.from.id) });
                await deleteTicTacToeDoc(ctx.from.id);
                delete games[ctx.from.id];
                return;
            }
            games[ctx.from.id].player = !games[ctx.from.id].player;
            await updateTicTacToe(ctx.from.id, games[ctx.from.id]);
            await ctx.editMessageText("Tic Tac Toe", { reply_markup: renderKeyboard(ctx.from.id) });
    }
});

function renderKeyboard(userId: number): InlineKeyboard {
    const keyboard: InlineKeyboard = new InlineKeyboard();
    let counter: number = 1;

    for (let i: number = 0; i < 9; i++, counter++) {
        keyboard.text(games[userId].board[i] === null ? " " : MARKS[+(games[userId].board[i] as boolean)], `${Callbacks.TIC_TAC_TOE} ${i}`);

        if (counter === 3) {
            keyboard.row();
            counter = 0;
        }
    }
    return keyboard;
}

const gameOver = (userId: number): boolean => 
    games[userId].board[0] === games[userId].player && games[userId].board[1] === games[userId].player && games[userId].board[2] === games[userId].player ||
    games[userId].board[3] === games[userId].player && games[userId].board[4] === games[userId].player && games[userId].board[5] === games[userId].player ||
    games[userId].board[6] === games[userId].player && games[userId].board[7] === games[userId].player && games[userId].board[8] === games[userId].player ||
    games[userId].board[0] === games[userId].player && games[userId].board[3] === games[userId].player && games[userId].board[6] === games[userId].player ||
    games[userId].board[1] === games[userId].player && games[userId].board[4] === games[userId].player && games[userId].board[7] === games[userId].player ||
    games[userId].board[2] === games[userId].player && games[userId].board[5] === games[userId].player && games[userId].board[8] === games[userId].player ||
    games[userId].board[0] === games[userId].player && games[userId].board[4] === games[userId].player && games[userId].board[8] === games[userId].player ||
    games[userId].board[2] === games[userId].player && games[userId].board[4] === games[userId].player && games[userId].board[6] === games[userId].player;

export default ticTacToeModule;