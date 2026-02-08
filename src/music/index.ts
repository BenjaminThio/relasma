import { type CommandContext, Composer, Context } from "grammy";

interface YouTubeInfo {
    ok: boolean;
    title: string;
    duration: number;
    url: string;
    ext: unknown;
    abr: unknown;
    mimeType: unknown;
}
const musicModule: Composer<Context> = new Composer();

musicModule.command("play", async (ctx: CommandContext<Context>): Promise<void> => {
    await ctx.reply("Fetching audio...");

    const res = await fetch(`https://${process.env.BASE_URL}/api/music`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: ctx.match })
    });

    const data: YouTubeInfo = await res.json() as YouTubeInfo;

    if (!res.ok) {
        await ctx.reply('Failed to fetch audio.');
        return;
    } else
        await ctx.replyWithAudio(data.url);
});

export default musicModule;