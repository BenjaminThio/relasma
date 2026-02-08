import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";
export default async (req, res) => webhookCallback(bot, "http")(req, res);
