export class Collection<K, V> extends Map<K, V> {
	toJSON() {
		return [ ...this.entries() ];
	}
}