import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config";
import { Keys } from "./index";

export interface CalculatorData {
    scientific: boolean,
    secondary: boolean,
    entries: number[],
    result: string
}
export type CalculatorDataField = "scientific" | "secondary" | "entries" | "result";

const calculatorRef = collection(db, "calculator");

export async function userExists(userId: number): Promise<boolean> {
    try {
        return (await getDoc(doc(calculatorRef, userId.toString()))).exists();
    } catch (err) {
        console.error("`userExists` function failed: ", err);
        throw(err);
    }
}

export async function createNewCalculator(userId: number, data: CalculatorData): Promise<void> {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(calculatorRef, userId.toString()), data, { merge: false });
}

export async function updateCalculator(userId: number, data: CalculatorData): Promise<void> {
    await setDoc(doc(calculatorRef, userId.toString()), data, { merge: true });
}

export async function updateCalculatorField(userId: number, field: CalculatorDataField, value: boolean | Keys[] | string): Promise<void> {
    await updateDoc(doc(calculatorRef, userId.toString()), {
        [field]: value
    });
}

export async function getCalculatorData(userId: number): Promise<CalculatorData> {
    return (await getDoc(doc(calculatorRef, userId.toString()))).data() as CalculatorData;
}