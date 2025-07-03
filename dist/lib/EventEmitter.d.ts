type EventMap = {
    [key: string]: any[];
};
export default class EventEmitter<Events extends EventMap> {
    private listeners;
    on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;
    off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;
    emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean;
}
export {};
