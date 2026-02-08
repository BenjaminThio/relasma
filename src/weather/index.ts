import { type CommandContext, Composer, Context } from "grammy";

interface OpenWeatherResponse {
	coord: {
		lon: number;
		lat: number;
	};
	weather: [
		{
			id: number;
			main: string;
			description: string;
			icon: string;
		}
	];
	base: string;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
		sea_level: number;
		grnd_level: number;
	};
	visibility: number;
	wind: {
		speed: number;
		deg: number;
		gust: number;
	};
	clouds: {
		all: number;
	};
	dt: number;
	sys: {
		country: string;
		sunrise: number;
		sunset: number;
	};
	timezone: number;
	id: number;
	name: string;
	cod: number;
}
const weatherModule: Composer<Context> = new Composer();
const API_KEY: string | undefined = process.env.OPEN_WEATHER_API_KEY;

if (API_KEY === undefined)
    throw new Error("`API_KEY` is unset.");

weatherModule.command("weather", async (ctx: CommandContext<Context>): Promise<void> => {
    if (!ctx.match) {
		ctx.reply('/weather [Location]');
		return;
	}

    // http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric
	const location: string = ctx.match;
	const response: Response = await fetch(`http://pro.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);

    if (!response.ok) {
        ctx.reply(`Invalid Location: ${location}`);
        return;
    }

    const data: OpenWeatherResponse = await response.json() as OpenWeatherResponse;
    await ctx.replyWithPhoto(
        `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        {
            caption: `Weather Information For \`${location.replace(
                '+',
                ' '
            )}\`\nWeather: \`${data.weather[0].main}\`\nDescription: \`${
                data.weather[0].description
            }\`\n\nOther Information For \`${location.replace(
                '+',
                ' '
            )}\`\nPressure: \`${data.main.pressure}hPa\`\nHumidity: \`${
                data.main.humidity
            }%\`\nWind Speed: \`${
                data.wind.speed
            }metre/sec\`\nWind Degrees: \`${
                data.wind.deg
            }°\`\nLongtitude: \`${data.coord.lon}\`\nLatitude: \`${
                data.coord.lat
            }\`\n\nQuery from \`${ctx.from?.username}\``,
            parse_mode: "Markdown"
        }
    );
});

weatherModule.command("temp", async (ctx: CommandContext<Context>): Promise<void> => {
    if (!ctx.match) {
		ctx.reply('/temp [Location]');
		return;
	}

	const location: string = ctx.match;
	const response: Response = await fetch(`http://pro.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);

    if (!response.ok) {
        ctx.reply(`Invalid Location: ${location}`);
        return;
    }
	
    const data: OpenWeatherResponse = await response.json() as OpenWeatherResponse;

    await ctx.reply(
        format(
            'Temperature Informations For `{0}`\nTemperature: {1}\nTemperature/Min: {2}\nTemperature/Max: {3}\nFeels Like: {4}\n\nQuery by `{5}`',
            location.replace('+', ' '),
            ...[
                data.main.temp,
                data.main.temp_min,
                data.main.temp_max,
                data.main.feels_like,
            ].map(
                (value) =>
                    `\`${value}°C / ${(value + 273.15).toFixed(2)}°K / ${(
                        (value * 9) / 5 +
                        32
                    ).toFixed(2)}°F\``
            ),
            ctx.from?.username
        ),
        {
            parse_mode: "Markdown"
        }
    );
});

function format(str: string, ...values: (string | undefined)[]) {
	return str.replace(/{(\d+)}/g, function (match, index) {
		return typeof values[index] !== 'undefined' ? values[index] : match;
	});
}

export default weatherModule;