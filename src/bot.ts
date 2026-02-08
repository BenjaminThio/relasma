// import { fileURLToPath, pathToFileURL } from "bun";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Api, Bot, Composer, Context, type CommandContext, type RawApi } from "grammy";
import path from "node:path";
import { readdir } from "node:fs/promises";

type CommandModule = { default: Composer<Context> }

const __filename: string = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const token: string | undefined = process.env.BOT_TOKEN;

if (token === undefined)
    throw new Error("`BOT_TOKEN` is unset.");

export const bot: Bot<Context, Api<RawApi>> = new Bot(token);

bot.command("start", async (ctx: CommandContext<Context>) => {
    await ctx.reply("Hello Mum!");
});

for (const file of await readdir(__dirname, { withFileTypes: true })) {
    if (!file.isDirectory())
        continue;
    else {
        const mod: CommandModule = (await import(pathToFileURL(path.join(__dirname, file.name, "index")).href)) as CommandModule;

        bot.use(mod.default);
    }
}
