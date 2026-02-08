export class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    equals(other) {
        if (!(other instanceof Coord))
            return false;
        return this.x === other.x && this.y === other.y;
    }
}
export const contains = (arr, a, b) => arr.some(coord => coord.equals(b === undefined ? a : new Coord(a, b)));
export var Movement;
(function (Movement) {
    Movement[Movement["UP"] = 0] = "UP";
    Movement[Movement["LEFT"] = 1] = "LEFT";
    Movement[Movement["DOWN"] = 2] = "DOWN";
    Movement[Movement["RIGHT"] = 3] = "RIGHT";
})(Movement || (Movement = {}));
export var Callbacks;
(function (Callbacks) {
    Callbacks[Callbacks["SNAKE"] = 0] = "SNAKE";
    Callbacks[Callbacks["SOKOBAN"] = 1] = "SOKOBAN";
    Callbacks[Callbacks["CALCULATOR"] = 2] = "CALCULATOR";
    Callbacks[Callbacks["TIC_TAC_TOE"] = 3] = "TIC_TAC_TOE";
})(Callbacks || (Callbacks = {}));
