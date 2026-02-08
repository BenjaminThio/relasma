import { bot } from "./bot.js";
import { Composer, Context } from "grammy";
import { fileURLToPath, pathToFileURL } from "bun";
//import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { readdir } from "node:fs/promises";

type CommandModule = { default: Composer<Context> }

const __filename: string = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const file of await readdir(__dirname, { withFileTypes: true })) {
    if (!file.isDirectory())
        continue;
    else {
        const mod: CommandModule = (await import(pathToFileURL(path.join(__dirname, file.name, "index")).href)) as CommandModule;

        bot.use(mod.default);
    }
}

bot.start();