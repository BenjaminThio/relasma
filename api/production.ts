import type { VercelRequest, VercelResponse } from "@vercel/node";
import { webhookCallback } from "grammy";
import { bot } from "../src/bot";

export default async (req: VercelRequest, res: VercelResponse) => webhookCallback(bot, "http")(req, res);