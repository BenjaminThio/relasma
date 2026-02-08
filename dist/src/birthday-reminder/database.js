import { collection, addDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
export const birthdayRef = collection(db, "birthday");
export async function createNewBirthday(data) {
    await addDoc(birthdayRef, data);
}
