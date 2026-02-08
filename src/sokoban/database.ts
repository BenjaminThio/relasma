import { type FirestoreDataConverter, type SnapshotOptions, QueryDocumentSnapshot, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
import { Coord } from "../types.js";

export interface SokobanGameData {
    player: Coord,
    boxes: Coord[];
    destinations: Coord[];
    barriers: Coord[];
}
export type SokobanGameDataField = "player" | "boxes" | "destinations" | "barriers";

export const sokobanGameDataConverter: FirestoreDataConverter<SokobanGameData> = {
    toFirestore: (data: SokobanGameData) => ({
        player: { x: data.player.x, y: data.player.y },
        boxes: data.boxes.map((coord: Coord) => ({x: coord.x, y: coord.y})),
        destinations: data.destinations.map((coord: Coord) => ({x: coord.x, y: coord.y})),
        barriers: data.barriers.map((coord: Coord) => ({x: coord.x, y: coord.y}))
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions | undefined) => {
        const data = snapshot.data(options);

        return {
            player: new Coord(data.player.x, data.player.y),
            boxes: data.boxes.map((coord: {x: number, y: number}) => new Coord(coord.x, coord.y)),
            destinations: data.destinations.map((coord: {x: number, y: number}) => new Coord(coord.x, coord.y)),
            barriers: data.barriers.map((coord: {x: number, y: number}) => new Coord(coord.x, coord.y))
        };
    }
};

const sokobanRef = collection(db, "sokoban").withConverter(sokobanGameDataConverter);

export async function userExists(userId: number): Promise<boolean> {
    try {
        return (await getDoc(doc(sokobanRef, userId.toString()))).exists();
    } catch (err) {
        console.error("`userExists` function failed: ", err);
        throw(err);
    }
}

export async function createNewSokobanGame(userId: number, data: SokobanGameData): Promise<void> {
    if (await userExists(userId)) {
        console.error("User already exists. Request denied.");
        return;
    }
    await setDoc(doc(sokobanRef, userId.toString()), {
        player: data.player,
        boxes: data.boxes,
        destinations: data.destinations,
        barriers: data.barriers
    }, { merge: false });
}

export async function updateSokobanGame(userId: number, data: SokobanGameData): Promise<void> {
    await setDoc(doc(sokobanRef, userId.toString()), data, { merge: true });
}

export async function updateSokobanGameField(userId: number, field: SokobanGameDataField, value: Coord | Coord[]): Promise<void> {
    await updateDoc(doc(sokobanRef, userId.toString()), {
        [field]: value
    });
}

export const getSokobanGameData = async (userId: number): Promise<SokobanGameData> => 
    (await getDoc(doc(sokobanRef, userId.toString()))).data() as SokobanGameData;

export async function deleteSokobanDoc(userId: number): Promise<void> {
    await deleteDoc(doc(sokobanRef, userId.toString()));
}