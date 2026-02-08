import type { VercelRequest , VercelResponse } from "@vercel/node";
import { bot } from "../src/bot";
import { type BirthdayData, birthdayRef } from "../src/birthday-reminder/database";
import { type DocumentData, getDocs, Query, query, QuerySnapshot, where } from "firebase/firestore";

const CHAT_ID: number = 1074283475;

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const today: Date = new Date();
    const q: Query<DocumentData, DocumentData> = query(birthdayRef,
        where("remindYear", "==", today.getFullYear()),
        where("month", "==", today.getMonth() + 1),
        where("day", "==", today.getDate())
    );
    const querySnapshot: QuerySnapshot<DocumentData, DocumentData> = await getDocs(q);

    querySnapshot.forEach(async doc => {
        await bot.api.sendMessage(CHAT_ID, `Happy Birthday ${(doc.data() as BirthdayData).name}!`);
    });
    // await bot.api.sendMessage(CHAT_ID, "Reminder is working...");

    res.status(200).json({ok: true});
};