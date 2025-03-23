"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playClickSound = void 0;
const playClickSound = (url, volume = 0.9) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play();
};
exports.playClickSound = playClickSound;
