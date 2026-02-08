import { type CallbackQueryContext, type CommandContext, Composer, Context, InlineKeyboard } from "grammy";
import { Callbacks } from "../types.js";
import { type TicTacToeData, createNewTicTacToe, deleteTicTacToeDoc, getTicTacToeData, updateTicTacToe, userExists } from "./database.js";

const ticTacToeModule: Composer<Context> = new Composer();
const MARKS: string[] = ["❌", "⭕️"];
const games: Record<string, TicTacToeData> = {};

const getGame = (userId: number): TicTacToeData => {
    const game: TicTacToeData | undefined = games[userId];

    if (game !== undefined)
        return game;
    else
        throw new Error("Game not found.");
};

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

            createNewTicTacToe(ctx.from.id, getGame(ctx.from.id));
        }
    }
    ctx.reply("Tic Tac Toe", { reply_markup: renderKeyboard(ctx.from.id) });
});

ticTacToeModule.callbackQuery(new RegExp(`^${Callbacks.TIC_TAC_TOE} ([0-8])$`), async (ctx: CallbackQueryContext<Context>): Promise<void> => {
    const idx: number = parseInt(ctx.match[1] as string);

    ctx.answerCallbackQuery();

    switch (getGame(ctx.from.id).board[idx]) {
        case null:
            getGame(ctx.from.id).board[idx] = getGame(ctx.from.id).player;
            if (gameOver(ctx.from.id)) {
                await ctx.editMessageText(`Tic Tac Toe\nGame Over! Player \`${+getGame(ctx.from.id).player + 1}\` wins.`, { reply_markup: renderKeyboard(ctx.from.id), parse_mode: "Markdown" });
                await deleteTicTacToeDoc(ctx.from.id);
                delete games[ctx.from.id];
                return;
            } else if (!getGame(ctx.from.id).board.some((mark: (boolean | null)) => mark === null)) {
                await ctx.editMessageText(`Tic Tac Toe\nGame Over! It's a tie.`, { reply_markup: renderKeyboard(ctx.from.id) });
                await deleteTicTacToeDoc(ctx.from.id);
                delete games[ctx.from.id];
                return;
            }
            getGame(ctx.from.id).player = !getGame(ctx.from.id).player;
            await updateTicTacToe(ctx.from.id, getGame(ctx.from.id));
            await ctx.editMessageText("Tic Tac Toe", { reply_markup: renderKeyboard(ctx.from.id) });
    }
});

function renderKeyboard(userId: number): InlineKeyboard {
    const keyboard: InlineKeyboard = new InlineKeyboard();
    let counter: number = 1;

    for (let i: number = 0; i < 9; i++, counter++) {
        keyboard.text(getGame(userId).board[i] === null ? " " : MARKS[+(getGame(userId).board[i] as boolean)] as string, `${Callbacks.TIC_TAC_TOE} ${i}`);

        if (counter === 3) {
            keyboard.row();
            counter = 0;
        }
    }
    return keyboard;
}

const gameOver = (userId: number): boolean => 
    getGame(userId).board[0] === getGame(userId).player && getGame(userId).board[1] === getGame(userId).player && getGame(userId).board[2] === getGame(userId).player ||
    getGame(userId).board[3] === getGame(userId).player && getGame(userId).board[4] === getGame(userId).player && getGame(userId).board[5] === getGame(userId).player ||
    getGame(userId).board[6] === getGame(userId).player && getGame(userId).board[7] === getGame(userId).player && getGame(userId).board[8] === getGame(userId).player ||
    getGame(userId).board[0] === getGame(userId).player && getGame(userId).board[3] === getGame(userId).player && getGame(userId).board[6] === getGame(userId).player ||
    getGame(userId).board[1] === getGame(userId).player && getGame(userId).board[4] === getGame(userId).player && getGame(userId).board[7] === getGame(userId).player ||
    getGame(userId).board[2] === getGame(userId).player && getGame(userId).board[5] === getGame(userId).player && getGame(userId).board[8] === getGame(userId).player ||
    getGame(userId).board[0] === getGame(userId).player && getGame(userId).board[4] === getGame(userId).player && getGame(userId).board[8] === getGame(userId).player ||
    getGame(userId).board[2] === getGame(userId).player && getGame(userId).board[4] === getGame(userId).player && getGame(userId).board[6] === getGame(userId).player;

export default ticTacToeModule;