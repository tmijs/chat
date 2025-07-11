type EventMap = {
	[key: string]: any[];
};

export default class EventEmitter<Events extends EventMap> {
	private listeners = new Map<keyof Events, Set<(...args: Events[keyof Events]) => void>>();
	on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void) {
		if(!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener as (...args: Events[keyof Events]) => void);
		return this;
	}
	off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void) {
		this.listeners.get(event)?.delete(listener as (...args: Events[keyof Events]) => void);
		return this;
	}
	emit<K extends keyof Events>(event: K, ...args: Events[K]) {
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