import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import db from "../../utils/firebase-config.js";
import { Coord } from "../types.js";
export const sokobanGameDataConverter = {
    toFirestore: (data) => ({
        player: { x: data.player.x, y: data.player.y },
        boxes: data.boxes.map((coord) => ({ x: coord.x, y: coord.y })),
        destinations: data.destinations.map((coord) => ({ x: coord.x, y: coord.y })),
        barriers: data.barriers.map((coord) => ({ x: coord.x, y: coord.y }))
    }),
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return {
            player: new Coord(data.player.x, data.player.y),
            boxes: data.boxes.map((coord) => new Coord(coord.x, coord.y)),
            destinations: data.destinations.map((coord) => new Coord(coord.x, coord.y)),
            barriers: data.barriers.map((coord) => new Coord(coord.x, coord.y))
        };
    }
};
const sokobanRef = collection(db, "sokoban").withConverter(sokobanGameDataConverter);
export async function userExists(userId) {
    try {
        return (await getDoc(doc(sokobanRef, userId.toString()))).exists();
    }
    catch (err) {
        console.error("`userExists` function failed: ", err);
        throw (err);
    }
}
export async function createNewSokobanGame(userId, data) {
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
export async function updateSokobanGame(userId, data) {
    await setDoc(doc(sokobanRef, userId.toString()), data, { merge: true });
}
export async function updateSokobanGameField(userId, field, value) {
    await updateDoc(doc(sokobanRef, userId.toString()), {
        [field]: value
    });
}
export const getSokobanGameData = async (userId) => (await getDoc(doc(sokobanRef, userId.toString()))).data();
export async function deleteSokobanDoc(userId) {
    await deleteDoc(doc(sokobanRef, userId.toString()));
}
