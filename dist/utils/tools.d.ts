export declare const wait: (ms: number) => Promise<unknown>;
export declare const openModal: (dialogId: string) => void;
export declare const closeModal: (dialogId: string) => void;
export declare const efectoClickClient: (elementId: string, callback: () => void) => Promise<void>;
export declare const efectoClickServer: (elementId: string, callback: () => void) => void;
