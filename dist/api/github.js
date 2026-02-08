import { bot } from "../src/bot.js";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import db from "../utils/firebase-config.js";
export async function updateChatId(chatId) {
    await updateDoc(doc(collection(db, "temp"), "report"), {
        "chatId": chatId
    });
}
export async function getChatId() {
    return (await getDoc(doc(collection(db, "temp"), "report"))).data().chatId;
}
export async function setReportChatId(ctx) {
    ctx.reply(`Setting Chat ID: \`${ctx.chat.id}\` as default chat to send Github report...`, { parse_mode: "Markdown" });
    await updateChatId(ctx.chat.id);
    ctx.reply(`✅ Chat ID: \`${ctx.chat.id}\` set`, { parse_mode: "Markdown" });
}
export default async (req, res) => {
    try {
        const event = req.headers["x-github-event"];
        if (event === "push") {
            const payload = req.body;
            const repoName = payload.repository.full_name;
            const repoLink = payload.repository.html_url;
            const branch = payload.ref.split('/').pop();
            const pusher = payload.pusher.name;
            const commitList = payload.commits.map((c) => `- ${c.message}`).join('\n');
            const compareUrl = payload.compare;
            const chatId = await getChatId();
            if (chatId)
                await bot.api.sendMessage(chatId, "🚀New Commit Pushed!\n\n" +
                    `📂 **Repo:** [${repoName}](${repoLink})\n` +
                    `🍁 **Branch:** ${branch}\n` +
                    `👤 **Pusher:** ${pusher}\n\n` +
                    `**Commits:**\n${commitList}\n\n` +
                    `[🔗 View Changes](${compareUrl})`, { parse_mode: "Markdown" });
            else
                console.error("Chat ID unset.");
            res.status(200).send("OK");
        }
    }
    catch (err) {
        console.error("💥 Crash: ", err);
        res.status(500).send("Error processing webhook");
    }
};
