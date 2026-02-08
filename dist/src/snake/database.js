import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
import { Coord } from "../types.js";
export const snakeGameDataConverter = {
    toFirestore: (data) => ({
        parts: data.parts.map((coord) => ({ x: coord.x, y: coord.y })),
        foodCoord: { x: data.foodCoord.x, y: data.foodCoord.y }
    }),
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return {
            parts: data.parts.map((coord) => new Coord(coord.x, coord.y)),
            foodCoord: new Coord(data.foodCoord.x, data.foodCoord.y)
        };
    }
};
const snakeRef = collection(db, "snake").withConverter(snakeGameDataConverter);
export async function userExists(userId) {
    try {
        return (await getDoc(doc(snakeRef, userId.toString()))).exists();
    }
    catch (err) {
        console.error("`userExists` function failed: ", err);
        throw (err);
    }
}
export async function createNewSnakeGame(userId, data) {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(snakeRef, userId.toString()), {
        parts: data.parts,
        foodCoord: data.foodCoord
    }, { merge: false });
}
export async function updateSnakeGame(userId, data) {
    await setDoc(doc(snakeRef, userId.toString()), data, { merge: true });
}
export async function updateSnakeGameField(userId, field, value) {
    await updateDoc(doc(snakeRef, userId.toString()), {
        [field]: value
    });
}
export async function getSnakeGameData(userId) {
    return (await getDoc(doc(snakeRef, userId.toString()))).data();
}
export async function deleteSnakeDoc(userId) {
    await deleteDoc(doc(snakeRef, userId.toString()));
}
