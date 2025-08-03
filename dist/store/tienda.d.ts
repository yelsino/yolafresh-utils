import { Carrito } from "@/interfaces/pedido";
declare class Store<T> {
    private state;
    private initialState;
    constructor(initialState: T);
    get(): T;
    set(newState: T): void;
    reset(): void;
}
export declare const carrito: Store<Carrito>;
export {};
