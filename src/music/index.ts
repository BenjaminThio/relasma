import { spawn } from "node:child_process";
import path from "node:path";
import { type CommandContext, Composer, Context, InputFile } from "grammy";

interface MusicInfo
{
    status: "success" | "error";
    title: string | null;
    duration: number | null;
    url: string;
    ext: string | null;
    abr: string | null;
    mimeType: string | null;
    message?: string
}

const musicModule: Composer<Context> = new Composer();

const getMusicInfo = (url: string): Promise<MusicInfo> => 
    new Promise((resolve, reject) => {
        const worker = spawn(path.join(__dirname, "./music.exe"), [url]);

        let err = "";
        let out = "";

        worker.stderr.on("data", (d) => (err += d.toString("utf8")));
        worker.stdout.on("data", (d) => (out += d.toString("utf8")));

        worker.on("error", reject);
        worker.on("close", (code) => {
            if (code !== 0) return reject("TEST");
            resolve(JSON.parse(out));
        });
    });

musicModule.command("play", async (ctx: CommandContext<Context>) => {
    const musicInfo = await getMusicInfo(ctx.match);

    await ctx.replyWithVideo(new InputFile({ url: musicInfo.url }));
});

export default musicModule;

/*
interface YouTubeInfo {
    ok: boolean;
    title: string;
    duration: number;
    url: string;
    ext: unknown;
    abr: unknown;
    mimeType: unknown;
}

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
*/