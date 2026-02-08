import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config";

export interface TicTacToeData {
    board: (boolean | null)[],
    player: boolean
}
export type TicTacToeDataField = "board" | "player";

const ticTacToeRef = collection(db, "ticTacToe");

export async function userExists(userId: number): Promise<boolean> {
    try {
        return (await getDoc(doc(ticTacToeRef, userId.toString()))).exists();
    } catch (err) {
        console.error("`userExists` function failed: ", err);
        throw(err);
    }
}

export async function createNewTicTacToe(userId: number, data: TicTacToeData): Promise<void> {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(ticTacToeRef, userId.toString()), data, { merge: false });
}

export async function updateTicTacToe(userId: number, data: TicTacToeData): Promise<void> {
    await setDoc(doc(ticTacToeRef, userId.toString()), data, { merge: true });
}

export async function updateTicTacToeField(userId: number, field: TicTacToeDataField, value: (boolean | null)[] | boolean): Promise<void> {
    await updateDoc(doc(ticTacToeRef, userId.toString()), {
        [field]: value
    });
}

export async function getTicTacToeData(userId: number): Promise<TicTacToeData> {
    return (await getDoc(doc(ticTacToeRef, userId.toString()))).data() as TicTacToeData;
}

export async function deleteTicTacToeDoc(userId: number): Promise<void> {
    await deleteDoc(doc(ticTacToeRef, userId.toString()));
}