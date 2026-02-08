import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
const calculatorRef = collection(db, "calculator");
export async function userExists(userId) {
    try {
        return (await getDoc(doc(calculatorRef, userId.toString()))).exists();
    }
    catch (err) {
        console.error("`userExists` function failed: ", err);
        throw (err);
    }
}
export async function createNewCalculator(userId, data) {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(calculatorRef, userId.toString()), data, { merge: false });
}
export async function updateCalculator(userId, data) {
    await setDoc(doc(calculatorRef, userId.toString()), data, { merge: true });
}
export async function updateCalculatorField(userId, field, value) {
    await updateDoc(doc(calculatorRef, userId.toString()), {
        [field]: value
    });
}
export async function getCalculatorData(userId) {
    return (await getDoc(doc(calculatorRef, userId.toString()))).data();
}
