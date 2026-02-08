import { type CallbackQueryContext, type CommandContext, Composer, Context, InlineKeyboard } from "grammy";
import { type CalculatorData, createNewCalculator, getCalculatorData, updateCalculator, userExists } from "./database.js";
import { Callbacks } from "../types.js";

const calculatorModule: Composer<Context> = new Composer();
const BASIC: InlineKeyboard = new InlineKeyboard()
    .text("©️", `${Callbacks.CALCULATOR} 10`).text("🔙", `${Callbacks.CALCULATOR} 11`).text("%", `${Callbacks.CALCULATOR} 12`).text("➗", `${Callbacks.CALCULATOR} 13`).row()
    .text("7️⃣", `${Callbacks.CALCULATOR} 7`).text("8️⃣", `${Callbacks.CALCULATOR} 8`).text("9️⃣", `${Callbacks.CALCULATOR} 9`).text("✖️", `${Callbacks.CALCULATOR} 14`).row()
    .text("4️⃣", `${Callbacks.CALCULATOR} 4`).text("5️⃣", `${Callbacks.CALCULATOR} 5`).text("6️⃣", `${Callbacks.CALCULATOR} 6`).text("➖", `${Callbacks.CALCULATOR} 15`).row()
    .text("1️⃣", `${Callbacks.CALCULATOR} 1`).text("2️⃣", `${Callbacks.CALCULATOR} 2`).text("3️⃣", `${Callbacks.CALCULATOR} 3`).text("➕", `${Callbacks.CALCULATOR} 16`).row()
    .text("🔄", `${Callbacks.CALCULATOR} 17`).text("0️⃣", `${Callbacks.CALCULATOR} 0`).text("⏺️", `${Callbacks.CALCULATOR} 18`).text("✔️", `${Callbacks.CALCULATOR} 19`);
const SCIENTIFIC: InlineKeyboard = new InlineKeyboard()
    .text("2nd", `${Callbacks.CALCULATOR} 20`).text("🚫", `${Callbacks.CALCULATOR} 21`).text("sin", `${Callbacks.CALCULATOR} 22`).text("cos", `${Callbacks.CALCULATOR} 23`).text("tan", `${Callbacks.CALCULATOR} 24`).row()
    .text("^", `${Callbacks.CALCULATOR} 25`).text("lg", `${Callbacks.CALCULATOR} 26`).text("ln", `${Callbacks.CALCULATOR} 27`).text("(", `${Callbacks.CALCULATOR} 28`).text(")", `${Callbacks.CALCULATOR} 29`).row()
    .text("√", `${Callbacks.CALCULATOR} 30`).text("©️", `${Callbacks.CALCULATOR} 10`).text("🔙", `${Callbacks.CALCULATOR} 11`).text("%", `${Callbacks.CALCULATOR} 12`).text("➗", `${Callbacks.CALCULATOR} 13`).row()
    .text("❕", `${Callbacks.CALCULATOR} 31`).text("7️⃣", `${Callbacks.CALCULATOR} 7`).text("8️⃣", `${Callbacks.CALCULATOR} 8`).text("9️⃣", `${Callbacks.CALCULATOR} 9`).text("✖️", `${Callbacks.CALCULATOR} 14`).row()
    .text("⁻¹", `${Callbacks.CALCULATOR} 32`).text("4️⃣", `${Callbacks.CALCULATOR} 4`).text("5️⃣", `${Callbacks.CALCULATOR} 5`).text("6️⃣", `${Callbacks.CALCULATOR} 6`).text("➖", `${Callbacks.CALCULATOR} 15`).row()
    .text("π", `${Callbacks.CALCULATOR} 33`).text("1️⃣", `${Callbacks.CALCULATOR} 1`).text("2️⃣", `${Callbacks.CALCULATOR} 2`).text("3️⃣", `${Callbacks.CALCULATOR} 3`).text("➕", `${Callbacks.CALCULATOR} 16`).row()
    .text("🔄", `${Callbacks.CALCULATOR} 17`).text("e", `${Callbacks.CALCULATOR} 34`).text("0️⃣", `${Callbacks.CALCULATOR} 0`).text("⏺️", `${Callbacks.CALCULATOR} 18`).text("✔️", `${Callbacks.CALCULATOR} 19`);
const INV_SCIENTIFIC: InlineKeyboard = new InlineKeyboard()
    .text("2nd", `${Callbacks.CALCULATOR} 20`).text("🚫", `${Callbacks.CALCULATOR} 21`).text("sin⁻¹", `${Callbacks.CALCULATOR} 35`).text("cos⁻¹", `${Callbacks.CALCULATOR} 36`).text("tan⁻¹", `${Callbacks.CALCULATOR} 37`).row()
    .text("^", `${Callbacks.CALCULATOR} 25`).text("lg", `${Callbacks.CALCULATOR} 26`).text("ln", `${Callbacks.CALCULATOR} 27`).text("(", `${Callbacks.CALCULATOR} 28`).text(")", `${Callbacks.CALCULATOR} 29`).row()
    .text("√", `${Callbacks.CALCULATOR} 30`).text("©️", `${Callbacks.CALCULATOR} 10`).text("🔙", `${Callbacks.CALCULATOR} 11`).text("%", `${Callbacks.CALCULATOR} 12`).text("➗", `${Callbacks.CALCULATOR} 13`).row()
    .text("❕", `${Callbacks.CALCULATOR} 31`).text("7️⃣", `${Callbacks.CALCULATOR} 7`).text("8️⃣", `${Callbacks.CALCULATOR} 8`).text("9️⃣", `${Callbacks.CALCULATOR} 9`).text("✖️", `${Callbacks.CALCULATOR} 14`).row()
    .text("⁻¹", `${Callbacks.CALCULATOR} 32`).text("4️⃣", `${Callbacks.CALCULATOR} 4`).text("5️⃣", `${Callbacks.CALCULATOR} 5`).text("6️⃣", `${Callbacks.CALCULATOR} 6`).text("➖", `${Callbacks.CALCULATOR} 15`).row()
    .text("π", `${Callbacks.CALCULATOR} 33`).text("1️⃣", `${Callbacks.CALCULATOR} 1`).text("2️⃣", `${Callbacks.CALCULATOR} 2`).text("3️⃣", `${Callbacks.CALCULATOR} 3`).text("➕", `${Callbacks.CALCULATOR} 16`).row()
    .text("🔄", `${Callbacks.CALCULATOR} 17`).text("e", `${Callbacks.CALCULATOR} 34`).text("0️⃣", `${Callbacks.CALCULATOR} 0`).text("⏺️", `${Callbacks.CALCULATOR} 18`).text("✔️", `${Callbacks.CALCULATOR} 19`);
export enum Keys {
    ZERO,
    ONE,
    TWO,
    THREE,
    FOUR,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE,
    CLEAR,
    BACKSPACE,
    PERCENTAGE,
    DIVIDE,
    MULTIPLY,
    MINUS,
    PLUS,
    MODE_SWITCH,
    DECIMAL,
    EQUAL,
    SECONDARY,
    IDK,
    SINE,
    COSINE,
    TANGENT,
    EXPONENT,
    LOG,
    NATURAL_LOG,
    LEFT_PARENTHESIS,
    RIGHT_PARENTHESIS,
    SQUARE_ROOT,
    FACTORIAL,
    POWER_OF_NEGATIVE_ONE,
    PI,
    EULER_NUMBER,
    ARCSINE,
    ARCCOSINE,
    ARCTANGENT
}
const calculators: Record<string, CalculatorData> = {};

const getCalculator = (userId: number): CalculatorData => {
    const calculator: CalculatorData | undefined = getCalculator(userId);

    if (calculator !== undefined)
        return calculator;
    else
        throw new Error("Calculator not found.");
};

calculatorModule.command("cal", async (ctx: CommandContext<Context>): Promise<void> => {
    if (ctx.from === undefined) {
        ctx.reply("`ctx.from` is undefined.");
        return;
    }

    if (!(ctx.from.id in calculators)) {
        if (await userExists(ctx.from.id)) {
            calculators[ctx.from.id] = await getCalculatorData(ctx.from.id);
        } else {
            calculators[ctx.from.id] = {
                scientific: false,
                secondary: false,
                entries: [],
                result: ""
            };

            createNewCalculator(ctx.from.id, getCalculator(ctx.from.id));
        }
    }
    ctx.reply(render(ctx.from.id), { reply_markup: getCalculator(ctx.from.id).scientific ? (getCalculator(ctx.from.id).secondary ? INV_SCIENTIFIC : SCIENTIFIC) : BASIC });
});

calculatorModule.callbackQuery(new RegExp(`^${Callbacks.CALCULATOR} ([0-9]|[1-2][0-9]|3[0-7])$`), async (ctx: CallbackQueryContext<Context>): Promise<void> => {
    const key: number = parseInt(ctx.match[1] as string);

    switch (key) {
        case Keys.CLEAR:
            getCalculator(ctx.from.id).entries = [];
            getCalculator(ctx.from.id).result = "";
            break;
        case Keys.BACKSPACE:
            getCalculator(ctx.from.id).entries.pop();
            break;
        case Keys.MODE_SWITCH:
            getCalculator(ctx.from.id).scientific = !getCalculator(ctx.from.id).scientific;
            break;
        case Keys.EQUAL:
            getCalculator(ctx.from.id).result = compileExpression(ctx.from.id);
            break;
        case Keys.SECONDARY:
            getCalculator(ctx.from.id).secondary = !getCalculator(ctx.from.id).secondary;
            break;
        default:
            getCalculator(ctx.from.id).entries.push(key);
    }

    ctx.answerCallbackQuery();
    await updateCalculator(ctx.from.id, getCalculator(ctx.from.id));
    await ctx.editMessageText(render(ctx.from.id), { reply_markup: getCalculator(ctx.from.id).scientific ? (getCalculator(ctx.from.id).secondary ? INV_SCIENTIFIC : SCIENTIFIC) : BASIC });
});

function render(userId: number): string {
    let renderer: string = "";

    for (const entry of getCalculator(userId).entries) {
        if (entry >= 0 && entry <= 9)
            renderer += entry;
        else {
            switch (entry) {
                case Keys.PERCENTAGE:
                    renderer += '%';
                    break;
                case Keys.DIVIDE:
                    renderer += '÷';
                    break;
                case Keys.MULTIPLY:
                    renderer += '×';
                    break;
                case Keys.MINUS:
                    renderer += '-';
                    break;
                case Keys.PLUS:
                    renderer += '+';
                    break;
                case Keys.DECIMAL:
                    renderer += '.';
                    break;
                case Keys.SINE:
                    renderer += "sin(";
                    break;
                case Keys.COSINE:
                    renderer += "cos(";
                    break;
                case Keys.TANGENT:
                    renderer += "tan(";
                    break;
                case Keys.EXPONENT:
                    renderer += "^";
                    break;
                case Keys.LOG:
                    renderer += "log(";
                    break;
                case Keys.NATURAL_LOG:
                    renderer += "ln(";
                    break;
                case Keys.LEFT_PARENTHESIS:
                    renderer += '(';
                    break;
                case Keys.RIGHT_PARENTHESIS:
                    renderer += ')';
                    break;
                case Keys.SQUARE_ROOT:
                    renderer += '√';
                    break;
                case Keys.FACTORIAL:
                    renderer += '!';
                    break;
                case Keys.POWER_OF_NEGATIVE_ONE:
                    renderer += "^-1";
                    break;
                case Keys.PI:
                    renderer += 'π';
                    break;
                case Keys.EULER_NUMBER:
                    renderer += 'e';
                    break;
                case Keys.ARCSINE:
                    renderer += 'arcsin(';
                    break;
                case Keys.ARCCOSINE:
                    renderer += 'arccos(';
                    break;
                case Keys.ARCTANGENT:
                    renderer += 'arctan(';
            }
        }
    }

    return `Entries: ${renderer.length > 0 ? renderer : '0'}\nResult: ${getCalculator(userId).result.length > 0 ? getCalculator(userId).result : '0'}`;
}

// Compiler
export function compileExpression(userId: number): string {
    let compiler = "";

    for (const entry of getCalculator(userId).entries) {
        if (entry >= 0 && entry <= 9)
            compiler += entry;
        else {
            switch (entry) {
                case Keys.PERCENTAGE:
                    compiler += '/100';
                    break;
                case Keys.DIVIDE:
                    compiler += '/';
                    break;
                case Keys.MULTIPLY:
                    compiler += '*';
                    break;
                case Keys.MINUS:
                    compiler += '-';
                    break;
                case Keys.PLUS:
                    compiler += '+';
                    break;
                case Keys.DECIMAL:
                    compiler += '.';
                    break;
                case Keys.SINE:
                    compiler += "Math.sin(";
                    break;
                case Keys.COSINE:
                    compiler += "Math.cos(";
                    break;
                case Keys.TANGENT:
                    compiler += "Math.tan(";
                    break;
                case Keys.EXPONENT:
                    compiler += '**';
                    break;
                case Keys.LOG:
                    compiler += "Math.log10(";
                    break;
                case Keys.NATURAL_LOG:
                    compiler += "Math.log(";
                    break;
                case Keys.LEFT_PARENTHESIS:
                    compiler += '(';
                    break;
                case Keys.RIGHT_PARENTHESIS:
                    compiler += ')';
                    break;
                case Keys.SQUARE_ROOT:
                    compiler += 'Math.sqrt(';
                    break;
                case Keys.FACTORIAL:
                    // compiler += '!';
                    break;
                case Keys.POWER_OF_NEGATIVE_ONE:
                    compiler += "**-1";
                    break;
                case Keys.PI:
                    compiler += 'Math.PI';
                    break;
                case Keys.EULER_NUMBER:
                    compiler += 'Math.E';
                    break;
                case Keys.ARCSINE:
                    compiler += 'Math.asin(';
                    break;
                case Keys.ARCCOSINE:
                    compiler += 'Math.acos(';
                    break;
                case Keys.ARCTANGENT:
                   compiler += 'Math.atan(';
            }
        }
    }

    return eval(compiler).toString();
}

export default calculatorModule;