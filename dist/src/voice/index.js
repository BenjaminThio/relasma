import { Composer } from "grammy";
const voiceModule = new Composer();
voiceModule.command("say", async (ctx) => {
    if (ctx.match === "") {
        ctx.reply("/say <text>");
        return;
    }
    const ttsUrl = `https://${process.env.BASE_URL}/api/text_to_speech?lang=en&text=${encodeURIComponent(ctx.match)}`;
    await ctx.replyWithAudio(ttsUrl);
    await ctx.reply(ctx.match);
});
export default voiceModule;
