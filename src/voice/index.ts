import { type CommandContext, Context, Composer } from "grammy";

const voiceModule: Composer<Context> = new Composer();

voiceModule.command("say", async (ctx: CommandContext<Context>): Promise<void> => {
    if (ctx.match === "") {
        ctx.reply("/say <text>");
        return;
    }

    const ttsUrl = `https://${process.env.BASE_URL}/api/text_to_speech?lang=en&text=${encodeURIComponent(ctx.match)}`;

    await ctx.replyWithAudio(ttsUrl);
    await ctx.reply(ctx.match);
});

export default voiceModule;