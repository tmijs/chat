type EventList = {
    [key: string]: (...args: any[]) => void;
};
export default class EventEmitter<Events extends EventList> {
    private listeners;
    on<K extends keyof Events>(event: K, listener: Events[K]): this;
    off<K extends keyof Events>(event: K, listener: Events[K]): this;
    emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): boolean;
}
export {};
