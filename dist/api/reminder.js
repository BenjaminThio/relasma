import { bot } from "../src/bot.js";
import { birthdayRef } from "../src/birthday-reminder/database.js";
import { getDocs, query, where } from "firebase/firestore";
const CHAT_ID = 1074283475;
export default async (req, res) => {
    const today = new Date();
    const q = query(birthdayRef, where("remindYear", "==", today.getFullYear()), where("month", "==", today.getMonth() + 1), where("day", "==", today.getDate()));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
        await bot.api.sendMessage(CHAT_ID, `Happy Birthday ${doc.data().name}!`);
    });
    // await bot.api.sendMessage(CHAT_ID, "Reminder is working...");
    res.status(200).json({ ok: true });
};
