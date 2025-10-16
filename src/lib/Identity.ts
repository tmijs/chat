export type TokenValue = string | (() => string | Promise<string>);

export default class Identity {
	name?: string;
	id?: string;
	private token?: TokenValue;
	static normalizeToken(value: string) {
		if(typeof value === 'string' && value.toLowerCase().startsWith('oauth:')) {
			value = value.slice('oauth:'.length);
		}
		return value;
	}
	isAnonymous() {
		return !this.token || (typeof this.token === 'string' && this.token.trim() === '');
	}
	setToken(value: TokenValue) {
		this.token = typeof value === 'string' ? Identity.normalizeToken(value) : value;
	}
	async getToken(): Promise<string> {
		if(typeof this.token === 'string') {
			return this.token;
		}
		else if(typeof this.token === 'function') {
			const value = await this.token();
			return Identity.normalizeToken(value);
		}
		else {
			throw new Error('Invalid token');
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')]() {
		const name = this.name ? `"${this.name}"` : 'undefined';
		const id = this.id ? `"${this.id}"` : this.id === '' ? '""' : 'undefined';
		const token = this.token ? typeof this.token === 'string' ? this.token === '' ? '""' : '[hidden]' : '[hidden function]' : 'undefined';
		return `Identity { name: ${name}, id: ${id}, token: ${token} }`;
	}
}