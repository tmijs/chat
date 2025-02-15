type EventList = {
	[key: string]: (...args: any[]) => void;
};

export default class EventEmitter<Events extends EventList> {
	private listeners: Map<keyof Events, Set<Events[keyof Events]>> = new Map();
	on<K extends keyof Events>(event: K, listener: Events[K]) {
		if(!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener);
		return this;
	}
	off<K extends keyof Events>(event: K, listener: Events[K]) {
		this.listeners.get(event)?.delete(listener);
		return this;
	}
	emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
		if(!this.listeners.has(event)) {
			if(event === 'error') {
				if(args[0] instanceof Error) {
					throw args[0];
				}
				else {
					const uncaughtError = new Error('Uncaught error emitted', { cause: args[0] });
					throw uncaughtError;
				}
			}
			return false;
		}
		for(const listener of this.listeners.get(event)!) {
			listener(...args);
		}
		return true;
	}
}