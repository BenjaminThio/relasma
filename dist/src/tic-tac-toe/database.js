import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
const ticTacToeRef = collection(db, "ticTacToe");
export async function userExists(userId) {
    try {
        return (await getDoc(doc(ticTacToeRef, userId.toString()))).exists();
    }
    catch (err) {
        console.error("`userExists` function failed: ", err);
        throw (err);
    }
}
export async function createNewTicTacToe(userId, data) {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(ticTacToeRef, userId.toString()), data, { merge: false });
}
export async function updateTicTacToe(userId, data) {
    await setDoc(doc(ticTacToeRef, userId.toString()), data, { merge: true });
}
export async function updateTicTacToeField(userId, field, value) {
    await updateDoc(doc(ticTacToeRef, userId.toString()), {
        [field]: value
    });
}
export async function getTicTacToeData(userId) {
    return (await getDoc(doc(ticTacToeRef, userId.toString()))).data();
}
export async function deleteTicTacToeDoc(userId) {
    await deleteDoc(doc(ticTacToeRef, userId.toString()));
}
