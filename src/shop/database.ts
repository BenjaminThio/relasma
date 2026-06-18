import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import db from '../../utils/firebase-config.js';
import { Callback } from '../types.js';
import { CategoryRecord, ShopRecord } from './index.js';

type ShopItems = CategoryRecord<string[]>;
type ShopItemIndexes = CategoryRecord<number[]>;
export type Skins = CategoryRecord<number>;
export const SHOP_ITEMS: ShopItems = {
    [Callback.SNAKE]: {
        background: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫'],
        barrier: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫'],
        head: ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '🙂', '🙂‍↕️', '😏', '😒', '🙂', '🙂‍↔️', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😶‍🌫️', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '🤥', '😶', '🫥', '😐', '🫤', '😑', '🫨', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '🫩', '😴', '🤤', '😪', '😮‍💨', '😵', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '🤡', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🌞', '🌝', '🌚', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🐴', '🦄', '🐲'],
        body: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️', '🟤'],
        food: ['🍄', '🍄‍🟫', '🍏', '🍎', '🍐', '🍊', '🍋', '🍋‍🟩', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🫛', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🫜', '🍠', '🫚', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🫙', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🫘', '🍯', '🥛', '🫗', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
    },
    [Callback.SOKOBAN]: {
        background: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫'],
        barrier: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫'],
        player: ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '🙂', '🙂‍↕️', '😏', '😒', '🙂', '🙂‍↔️', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😶‍🌫️', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '🤥', '😶', '🫥', '😐', '🫤', '😑', '🫨', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '🫩', '😴', '🤤', '😪', '😮‍💨', '😵', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '🤡', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🌞', '🌝', '🌚', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🐴', '🦄', '🐲'],
        box: ['📦', '💵', '💴', '💶', '💷', '🪙', '💰', '💎', '⚽️', '🏀', '🏈', '⚾️', '🥎', '🏐', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🎁', '✉️', '📧', '💌', '💍', '👝', '👛', '👜', '💼', '🎒', '🧳', '⭐️', '🌟', '✨', '☄️', '🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
        destination: ['❌', '🥅', '⛳️', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺️', '🛖', '🏠', '🏡', '🏘', '🏚', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪️', '🕌', '🕍', '🛕', '⛩', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁', '📪', '📫', '📬', '📭', '📮', '🗑']
    }
};

export const INITIAL_DIAMOND_QUANTITY: number = 1000;
export const INITIAL_SKINS: Skins = {
    [Callback.SNAKE]: {
        background: 7,
        barrier: 5,
        head: 59,
        body: 2,
        food: 3
    },
    [Callback.SOKOBAN]: {
        background: 7,
        barrier: 5,
        player: 5,
        box: 0,
        destination: 0
    }
} as const;
export const INITIAL_PURCHASED_SHOP_ITEMS: ShopItemIndexes = {
    [Callback.SNAKE]: {
        background: [7],
        barrier: [5],
        head: [59],
        body: [2],
        food: [3]
    },
    [Callback.SOKOBAN]: {
        background: [7],
        barrier: [5],
        player: [5],
        box: [0],
        destination: [0]
    }
} as const;
export const INITIAL_STARRED_SHOP_ITEMS: ShopItemIndexes = {
    [Callback.SNAKE]: {
        background: [],
        barrier: [],
        head: [],
        body: [],
        food: []
    },
    [Callback.SOKOBAN]: {
        background: [],
        barrier: [],
        player: [],
        box: [],
        destination: []
    }
} as const;

export interface ShopData
{
    diamonds: number;
    purchasedShopItems: ShopItemIndexes;
    equippedSkins: Skins;
    starredShopItems: ShopItemIndexes;
}

const shopRef = collection(db, 'shop');

export async function userExists(userId: number): Promise<boolean> {
    try {
        return (await getDoc(doc(shopRef, userId.toString()))).exists();
    } catch (err) {
        console.error('`userExists` function failed: ', err);
        throw(err);
    }
}

export async function initializeShopData(userId: number, data: ShopData): Promise<void> {
    if (await userExists(userId)) {
        console.error('User already exists. Request denied.');
        return;
    }
    await setDoc(doc(shopRef, userId.toString()), {
        purchasedShopItems: data.purchasedShopItems,
        equippedSkins: data.equippedSkins
    }, { merge: false });
}

export async function updateShopData(userId: number, data: ShopRecord): Promise<void> {
    await setDoc(doc(shopRef, userId.toString()), {
        diamonds: data.diamonds,
        purchasedShopItems: data.purchasedShopItems,
        equippedSkins: data.equippedSkins,
        starredShopItems: data.starredShopItems
    } as ShopData, { merge: true });
}

export async function updateShopField<Field extends keyof ShopData>(userId: number, field: Field, value: ShopData[Field]): Promise<void> {
    await updateDoc(doc(shopRef, userId.toString()), {
        [field]: value
    });
}

export async function getShopData(userId: number): Promise<ShopData> {
    return (await getDoc(doc(shopRef, userId.toString()))).data() as ShopData;
}

export async function deleteShopDoc(userId: number): Promise<void> {
    await deleteDoc(doc(shopRef, userId.toString()));
}