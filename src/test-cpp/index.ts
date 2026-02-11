import { spawn } from "node:child_process";
import { Composer } from "grammy";
import path from "node:path";

const module = new Composer();

function test(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const worker = spawn(path.join(__dirname, "./worker.exe"));

        let err = "";
        let out = "";

        worker.stderr.on("data", (d) => (err += d.toString("utf8")));
        worker.stdout.on("data", (d) => (out += d.toString("utf8")));

        worker.on("error", reject);
        worker.on("close", (code) => {
            if (code !== 0) return reject(new Error("TEST"));
            resolve(out);
        });

        worker.stdin.write(input);
        worker.stdin.end();
    });
}

module.command("test_cpp", async (ctx) => {
    const t = await test("BENJAMIN");

    await ctx.reply(t);
});

export default module;