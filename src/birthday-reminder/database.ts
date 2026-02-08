import { collection, addDoc } from "firebase/firestore";
import db from "../../utils/firebase-config";

export interface BirthdayData {
    name: string;
    day: number;
    month: number;
    year: number;
    remindYear: number
}

export const birthdayRef = collection(db, "birthday");

export async function createNewBirthday(data: BirthdayData): Promise<void> {
    await addDoc(birthdayRef, data);
}