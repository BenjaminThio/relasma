import { CommandContext, Composer, Context, InputFile } from "grammy";
import { createReadStream } from 'node:fs';
import { createInterface } from "node:readline";
import { $ } from 'bun';

const emojipediaModule: Composer<Context> = new Composer();

interface EmojiDesignTimeline
{
    date: string,
    image_url: string,
    version: string
}

interface EmojiDesign
{
    title: string,
    description: string,
    timelines: EmojiDesignTimeline[]
}

interface Emoji
{
    character: string,
    name: string,
    description: string[],
    code: string,
    render_quality: number, // int
    version: number, // float
    category: {
        main: string | null,
        sub: string | null
    },
    variant?: boolean,
    alias?: string[],
    alert?: string,
    designs: EmojiDesign[]
}

export interface EmojiDefinition
{
    imageSource: string | InputFile;
    caption: string;
}

class JSONL
{
    filePath: string;

    constructor(filePath: string)
    {
        this.filePath = filePath;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async find(entry: string): Promise<any>
    {
        const fileStream = createReadStream(this.filePath);
        const readline = createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of readline)
        {
            if (line.includes(entry))
            {
                return JSON.parse(line);
            }
        }

        return null;
    }
}

const FILE_PATH: string = 'utils/emoji/emoji.jsonl';

export async function getEmojiDefinition(emojiChar: string, animated: boolean = false): Promise<EmojiDefinition>
{
    const jsonLines = new JSONL(FILE_PATH);
    const emoji: Emoji = await jsonLines.find(`"character": "${emojiChar}"`);
    const history: string = emoji.description.pop() as string;
    const caption: string = `<b>${
        emoji.name
    }</b>\n<pre><code class='language-Character'>${
        emoji.character
    }</code></pre>\n\n<b>🏷 Shortcode</b>\n<code>${
        emoji.code
    }</code>\n<b>🔖 Aliases</b>\n<code>${
        emoji.alias?.join('\n') ?? 'None'
    }</code>\n<b>🎥 Render Quality</b>\n<code>${
        emoji.render_quality
    }</code>\n<b>📦 Version</b>\n<code>Emoji ${
        emoji.version
    }</code>\n<b>📂 Category</b>\n<code>${
        emoji.category.main
    } >> ${
        emoji.category.sub
    }</code>\n\n<pre><code class='language-Description'>${
        emoji.description.join('\n\n')
    }</code></pre>\n\n<pre><code class='language-History'>${
        history
    }</code></pre>\n\n<pre><code class='language-Alert'>${
        emoji.alert
    }</code></pre>`;
    let designImageUrl: string = '';

    if (animated)
    {
        for (const [, design] of Object.entries(emoji.designs))
        {
            if (animated && design.title.includes('Microsoft Teams (3D Animated)'))
            {
                designImageUrl = design.timelines[design.timelines.length - 1].image_url;
                const gifArrayBuffer: ArrayBuffer = await $`ffmpeg -i ${designImageUrl} -filter_complex "[0:v] split [a][b];[a] palettegen=reserve_transparent=1 [p];[b][p] paletteuse=alpha_threshold=128" -f gif pipe:1`.quiet().arrayBuffer();
                const gifData: Uint8Array<ArrayBuffer> = new Uint8Array(gifArrayBuffer);

                return { imageSource: new InputFile(gifData, 'animated_emoji.gif'), caption: caption };
            }
        }
    }

    for (const [, design] of Object.entries(emoji.designs))
    {
        if (design.title.includes('Microsoft 3D Fluent'))
        {
            designImageUrl = design.timelines[design.timelines.length - 1].image_url;

            return { imageSource: designImageUrl, caption: caption };
        }
    }

    switch (designImageUrl.length)
    {
        case 0:
            designImageUrl = emoji.designs[0].timelines[0].image_url;
    }

    return { imageSource: designImageUrl, caption: caption };
}

emojipediaModule.command('emojipedia', async (ctx: CommandContext<Context>) => {
    const emojiDefinition: EmojiDefinition = await getEmojiDefinition(ctx.match);

    await ctx.replyWithPhoto(emojiDefinition.imageSource, {
        caption: emojiDefinition.caption,
        parse_mode: 'HTML'
    });
});

export default emojipediaModule;