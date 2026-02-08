import type { VercelRequest, VercelResponse } from "@vercel/node";
import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";
import snakeModule from "../src/snake/index.js";
import sokobanModule from "../src/sokoban/index.js";
import ticTacToeModule from "../src/tic-tac-toe/index.js";
import weatherModule from "../src/weather/index.js";
import calculatorModule from "../src/calculator/index.js";
import musicModule from "../src/music/index.js";
import voiceModule from "../src/voice/index.js";
import birthdayModule from "../src/birthday-reminder/index.js";

bot.use(snakeModule);
bot.use(sokobanModule);
bot.use(ticTacToeModule);
bot.use(weatherModule);
bot.use(calculatorModule);
bot.use(musicModule);
bot.use(voiceModule);
bot.use(birthdayModule);

export default async (req: VercelRequest, res: VercelResponse) => webhookCallback(bot, "http")(req, res);