import type { VercelRequest , VercelResponse } from "@vercel/node";
import { bot } from "../src/bot.js";
import { remindBirthday } from "../src/birthday-reminder/index.js";

export default async (_req: VercelRequest, res: VercelResponse): Promise<void> => {
    await remindBirthday(bot);
    res.status(200).json({ok: true});
};