import { type CommandContext, Composer, Context } from "grammy";
import { createNewBirthday } from "./database";

const birthdayModule: Composer<Context> = new Composer();
const SEPARATORS: string[] = ['/', '-', '.'];
const MONTHS: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class Birthday {
    public day: number;
    public month: number;
    public year: number;

    constructor(day: number, month: number, year: number) {
        this.day = day;
        this.month = month;
        this.year = year;
    }

    public static tryParse(s: string, retryCounter: number = 0): Birthday {
        // eslint-disable-next-line no-useless-assignment
        let date: string[] = [];

        switch (retryCounter) {
            case 0:
            case 1:
            case 2:
                date = s.split(SEPARATORS[retryCounter]!);
                break;
            default:
                throw new Error(`Invalid format.\nExamples:\n${
                    SEPARATORS.map(
                        (separator: string) => ["DAY", "MONTH", "YEAR"].join(separator)
                    ).join('\n')
                }`);
        }

        if (date.length < 2)
            return this.tryParse(s, retryCounter + 1);

        const birthday: Birthday = new Birthday(Number(date[0]), Number(date[1]), date.length === 3 ? Number(date[2]) : new Date().getFullYear());
        const errs: string[] = [];

        if (Number.isNaN(birthday.day))
            errs.push("Parameter <Day> is not a valid integer.");

        if (Number.isNaN(birthday.month)) {
            birthday.month = this.tryParseMonth(date[1]!);

            if (Number.isNaN(birthday.month))
                errs.push("Parameter <Month> is not a valid integer.");
        }
        if (Number.isNaN(birthday.year))
            errs.push("Parameter <Year> is not a valid integer.");
        if (!this.isValidDate(birthday.day, birthday.month, birthday.year))
            errs.push(`${birthday.toString()} is not a valid date.`);
        if (errs.length > 0)
            throw errs.map((err, i) => `${i + 1}. ${err}`).join('\n');

        return birthday;
    }

    public static tryParseMonth = (month: string): number => MONTHS.includes(month) ? MONTHS.indexOf(month) : Number.NaN;

    public static isValidDate = (day: number, month: number, year: number): boolean => month >= 1 && month <= 12 && day >= 1 ? ((month > 7 ? month + 1 : month) % 2 === 0 ? (month === 2 ? (year % 100 !== 0 && year % 4 === 0 || year % 400 === 0 ? day <= 29 : day <= 28) : day <= 30) : day <= 31) : false;

    public toString = (): string => `${this.day}/${this.month}/${this.year}`;
}

birthdayModule.command("birthday", async (ctx: CommandContext<Context>): Promise<void> => {
    const payload: string = ctx.match;

    if (payload === "") {
        ctx.reply("/birthday <name> <date>");
        return;
    }

    try {
        const params: string[] = payload.split(' ');

        if (params.length >= 2) {
            const birthday: Birthday = Birthday.tryParse(params[0]!);

            params.slice(0, 1);

            const name: string = params.join(' ');
            const today: Date = new Date();
            let year: number = today.getFullYear();
            const remindDate: Date = new Date(year, birthday.month, birthday.day);

            if (remindDate < today)
                year += 1;

            await createNewBirthday({
                name: name,
                day: birthday.day,
                month: birthday.month,
                year: birthday.year,
                remindYear: year
            });
            await ctx.reply(`Set birthday reminder: \`${remindDate.toDateString()}\` for \`${name}\``, { parse_mode: "Markdown" });
        } else
            await ctx.reply("/birthday <name> <date>");
    }
    catch (err: unknown) {
        await ctx.reply(`Error:\n${err}`);
    }
});

export default birthdayModule;