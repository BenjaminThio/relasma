import { type FirestoreDataConverter, type SnapshotOptions, QueryDocumentSnapshot, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config";
import { Coord } from "../types";

export interface SnakeGameData {
    parts: Coord[],
    foodCoord: Coord
}
export type SnakeGameDataField = "parts" | "foodCoord"

export const snakeGameDataConverter: FirestoreDataConverter<SnakeGameData> = {
    toFirestore: (data: SnakeGameData) => ({
        parts: data.parts.map((coord: Coord) => ({ x: coord.x, y: coord.y })),
        foodCoord: { x: data.foodCoord.x, y: data.foodCoord.y }
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions | undefined) => {
        const data = snapshot.data(options);

        return {
            parts: data.parts.map((coord: {x: number, y: number}) => new Coord(coord.x, coord.y)),
            foodCoord: new Coord(data.foodCoord.x, data.foodCoord.y)
        };
    }
};
const snakeRef = collection(db, "snake").withConverter(snakeGameDataConverter);

export async function userExists(userId: number): Promise<boolean> {
    try {
        return (await getDoc(doc(snakeRef, userId.toString()))).exists();
    } catch (err) {
        console.error("`userExists` function failed: ", err);
        throw(err);
    }
}

export async function createNewSnakeGame(userId: number, data: SnakeGameData): Promise<void> {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(snakeRef, userId.toString()), {
        parts: data.parts,
        foodCoord: data.foodCoord
    }, { merge: false });
}

export async function updateSnakeGame(userId: number, data: SnakeGameData): Promise<void> {
    await setDoc(doc(snakeRef, userId.toString()), data, { merge: true });
}

export async function updateSnakeGameField(userId: number, field: SnakeGameDataField, value: Coord | Coord[]): Promise<void> {
    await updateDoc(doc(snakeRef, userId.toString()), {
        [field]: value
    });
}

export async function getSnakeGameData(userId: number): Promise<SnakeGameData> {
    return (await getDoc(doc(snakeRef, userId.toString()))).data() as SnakeGameData;
}

export async function deleteSnakeDoc(userId: number): Promise<void> {
    await deleteDoc(doc(snakeRef, userId.toString()));
}