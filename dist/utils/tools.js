"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.efectoClickServer = exports.efectoClickClient = exports.closeModal = exports.openModal = exports.wait = void 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.wait = wait;
const openModal = (dialogId) => {
    const modal = document.getElementById(dialogId);
    modal.showModal();
};
exports.openModal = openModal;
const closeModal = (dialogId) => {
    const modal = document.getElementById(dialogId);
    modal.close();
};
exports.closeModal = closeModal;
const efectoClickClient = async (elementId, callback) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento con id "${elementId}" no encontrado.`);
        return;
    }
    element.style.backgroundColor = 'tomato';
    element.style.color = 'yellow';
    await (0, exports.wait)(500);
    callback();
};
exports.efectoClickClient = efectoClickClient;
const efectoClickServer = (elementId, callback) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento con id "${elementId}" no encontrado.`);
        return;
    }
    element.addEventListener("click", async (event) => {
        event.preventDefault();
        element.style.backgroundColor = 'tomato';
        element.style.color = 'yellow';
        await (0, exports.wait)(500);
        callback();
    });
};
exports.efectoClickServer = efectoClickServer;
