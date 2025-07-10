import type { ChannelString } from '@tmi.js/irc-parser';
import { UserState } from '../twitch/events';

export default class Channel {
	static toLogin(channelName: string) {
		const name = channelName.trim().toLowerCase();
		return name.startsWith('#') ? name.slice(1) : name;
	}
	static toIrc(channelName: string | Channel): ChannelString {
		if(channelName instanceof Channel) {
			return `#${channelName.login}`;
		}
		return `#${Channel.toLogin(channelName)}`;
	}

	lastUserstate: Omit<UserState.Event, 'channel'> | null = null;
	constructor(private _id: string, private _login: string) {
		this.id = _id;
		this.login = _login;
	}

	set id(value: string) {
		if(typeof value !== 'string') {
			throw new TypeError('Channel#id must be a string');
		}
		this._id = value;
	}
	get id() {
		return this._id;
	}

	set login(value: string) {
		if(typeof value !== 'string') {
			throw new TypeError('Channel#login must be a string');
		}
		this._login = Channel.toLogin(value);
	}
	get login() {
		return this._login;
	}

	toString() {
		return Channel.toIrc(this._login);
	}
}

export class ChannelPlaceholder extends Channel {
	constructor(id?: string, login?: string) {
		if(id === undefined && login) {
			id = `unknownId:login(${Channel.toLogin(login)})`;
		}
		else if(login === undefined && id) {
			login = `unknownLogin:id(${id})`;
		}
		else if(id === undefined && login === undefined) {
			throw new Error('ChannelPlaceholder must have either id or login');
		}
		super(id!, login!);
	}
}
