import type { ChannelString } from '@tmi.js/irc-parser';
import { UserState } from '../twitch/events';
export default class Channel {
    private _id;
    private _login;
    static toLogin(channelName: string): string;
    static toIrc(channelName: string | Channel): ChannelString;
    lastUserstate: Omit<UserState.Event, 'channel'> | null;
    constructor(_id: string, _login: string);
    set id(value: string);
    get id(): string;
    set login(value: string);
    get login(): string;
    toString(): `#${string}`;
}
export declare class ChannelPlaceholder extends Channel {
    constructor(id?: string, login?: string);
}
