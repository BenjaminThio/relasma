import { Composer } from "grammy";
const musicModule = new Composer();
musicModule.command("play", async (ctx) => {
    await ctx.reply("Fetching audio...");
    const res = await fetch(`https://${process.env.BASE_URL}/api/music`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: ctx.match })
    });
    const data = await res.json();
    if (!res.ok) {
        await ctx.reply('Failed to fetch audio.');
        return;
    }
    else
        await ctx.replyWithAudio(data.url);
});
export default musicModule;
