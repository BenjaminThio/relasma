import { type CommandContext, Bot, Composer, Context } from "grammy";

const token: string | undefined = process.env.BOT_TOKEN;
const module: Composer<Context> = new Composer();

if (token === undefined)
    throw new Error("`BOT_TOKEN` is unset.");

export const bot = new Bot(token);

module.command("start", async (ctx: CommandContext<Context>): Promise<void> => {
    await ctx.reply("Hello Mum!");
});

bot.use(module);