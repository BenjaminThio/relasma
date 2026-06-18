import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
import { type DocumentData, getDocs, Query, query, QuerySnapshot, where } from "firebase/firestore";

export interface BirthdayData {
    name: string;
    day: number;
    month: number;
    year: number;
    remindYear: number,
    chatId: number
}

const birthdayRef = collection(db, "birthday");

export async function createNewBirthday(data: BirthdayData): Promise<void> {
    await addDoc(birthdayRef, data);
}

export async function getTodayBirthdayDocs(): Promise<QuerySnapshot<DocumentData, DocumentData>>
{
    const today: Date = new Date();
        const q: Query<DocumentData, DocumentData> = query(birthdayRef,
        where("remindYear", "==", today.getFullYear()),
        where("month", "==", today.getMonth() + 1),
        where("day", "==", today.getDate())
    );
    const querySnapshot: QuerySnapshot<DocumentData, DocumentData> = await getDocs(q);

    return querySnapshot;
}

export async function updateBirthdayData(docId: string, data: BirthdayData): Promise<void> {
    await setDoc(doc(birthdayRef, docId), data, { merge: true });
}