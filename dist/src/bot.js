import { fileURLToPath, pathToFileURL } from "bun";
import { Bot } from "grammy";
import path from "node:path";
import { readdir } from "node:fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const token = process.env.BOT_TOKEN;
if (token === undefined)
    throw new Error("`BOT_TOKEN` is unset.");
export const bot = new Bot(token);
bot.command("start", async (ctx) => {
    await ctx.reply("Hello Mum!");
});
for (const file of await readdir(__dirname, { withFileTypes: true })) {
    if (!file.isDirectory())
        continue;
    else {
        const mod = (await import(pathToFileURL(path.join(__dirname, file.name, "index")).href));
        bot.use(mod.default);
    }
}
