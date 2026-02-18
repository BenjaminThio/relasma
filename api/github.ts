import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Commit, PushEvent } from "@octokit/webhooks-types";
import { bot } from "../src/bot.js";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../utils/firebase-config.js";
import { type CommandContext, Context } from "grammy";

export async function updateChatId(chatId: number): Promise<void> {
    await updateDoc(doc(collection(db, "temp"), "report"), {
        "chatId": chatId
    });
}

export async function getChatId(): Promise<number | null> {
    return ((await getDoc(doc(collection(db, "temp"), "report"))).data() as { chatId: number | null }).chatId;
}

export async function setReportChatId(ctx: CommandContext<Context>) {
    await ctx.reply(`Setting Chat ID: \`${ctx.chat.id}\` as default chat to send Github report...`, { parse_mode: "Markdown" });
    await updateChatId(ctx.chat.id);
    await ctx.reply(`✅ Chat ID: \`${ctx.chat.id}\` set`, { parse_mode: "Markdown" });
}

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
        const event = req.headers["x-github-event"];

        if (event === "push") {
            const payload: PushEvent = req.body as PushEvent;
            const repoName: string = payload.repository.full_name;
            const repoLink: string = payload.repository.html_url;
            const branch: string | undefined = payload.ref.split('/').pop();
            const pusher: string = payload.pusher.name;
            const commitList = payload.commits.map((c: Commit) => `- ${c.message}`).join('\n');
            const compareUrl = payload.compare;
            const chatId: number | null = await getChatId();

            if (chatId)
                await bot.api.sendMessage(chatId,
                    "🚀 <b>New Commit Pushed!</b>\n\n" +
                    `📂 <b>Repo:</b> <a href="${repoLink}">${repoName}</a>\n` + 
                    `🍁 <n>Branch:</b> ${branch}\n` +
                    `👤 <b>Pusher:</b> ${pusher}\n\n` +
                    `<b>Commits:</b>\n${commitList}\n\n` +
                    `<a href="${compareUrl}">🔗 View Changes</a>`, { parse_mode: "HTML" }
                );
            else
                console.error("Chat ID unset.");
            res.status(200).send("OK");
        }
    } catch (err) {
        console.error("💥 Crash: ", err);
        res.status(500).send("Error processing webhook");
    }
};