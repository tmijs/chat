import type { IrcMessage, FormatMessage } from '@tmi.js/irc-parser';
import EventEmitter from './lib/EventEmitter';
import * as irc from './irc';
import Identity, { type TokenValue } from './lib/Identity';
import type { Message, Whisper, UserState, RoomState, Moderation, Raid, Subscription, SharedChatNotice, GlobalUserState } from './twitch/events';
import Channel, { ChannelPlaceholder } from './lib/Channel';
export interface ClientOptions {
    channels: string[];
    token: TokenValue;
}
type ConnectionEvents = {
    connect: () => void;
    close: (event: {
        reason: string;
        code: number;
        wasCloseCalled: boolean;
    }) => void;
    socketError: (event: Event) => void;
    reconnecting: (event: {
        attempts: number;
        waitTime: number;
    }) => void;
    pong: () => void;
};
type OtherEvents = {
    ircMessage: (ircMessage: IrcMessage) => void;
    error: (error: Error) => void;
};
declare namespace MessageDropped {
    interface Event {
        channel: Channel;
        reason: string;
        tags: irc.NOTICE.Tags;
    }
}
type ChatEvents = {
    message: (event: Message.Event) => void;
    messageDropped: (event: MessageDropped.Event) => void;
    whisper: (event: Whisper.Event) => void;
    globalUserState: (event: GlobalUserState.Event) => void;
    userState: (event: UserState.Event) => void;
    roomState: (event: RoomState.Event) => void;
    moderation: (event: Moderation.Event) => void;
    raid: (event: Raid.Event) => void;
    sub: (event: Subscription.Event) => void;
    badgeUpgrade: (event: Message.EventBadgeUpgrade) => void;
    sharedChatNotice: (event: SharedChatNotice.Event) => void;
    join: (event: {
        channel: Channel;
    }) => void;
    part: (event: {
        channel: Channel;
    }) => void;
};
export type ClientEvents = ConnectionEvents & OtherEvents & ChatEvents;
interface Keepalive {
    maxWaitTimeoutMs: number;
    /** The timestamp of the last ping received. */
    lastPingReceivedAt?: number;
    /** The timestamp of the last pong received. */
    lastPongReceivedAt?: number;
    /** The timestamp of the last ping sent. */
    lastPingSent?: number;
    /** The latency in milliseconds. */
    latencyMs?: number;
    /** The interval ID for the ping interval. */
    pingInterval?: ReturnType<typeof setInterval>;
    /** The interval in seconds between each ping. */
    pingIntervalSeconds: number;
    /** The timeout ID for the ping timeout. */
    pingTimeout?: ReturnType<typeof setTimeout>;
    /** The timeout in seconds for the ping timeout. */
    pingTimeoutSeconds: number;
    /** The amount of reconnect attempts. */
    reconnectAttempts: number;
}
export declare class Client extends EventEmitter<ClientEvents> {
    socket?: WebSocket;
    readonly keepalive: Keepalive;
    channelsPendingJoin: Set<string>;
    channels: Set<Channel>;
    channelsById: Map<string, Channel>;
    channelsByLogin: Map<string, Channel>;
    identity: Identity;
    wasCloseCalled: boolean;
    constructor(opts?: Partial<ClientOptions>);
    connect(): void;
    close(): void;
    reconnect(): Promise<void>;
    private onSocketMessage;
    private onSocketClose;
    private onSocketOpen;
    private onSocketError;
    getChannelById(id: string): Channel | undefined;
    getChannelByLogin(login: string): Channel | undefined;
    getChannelPlaceholder(id?: string, login?: string): ChannelPlaceholder;
    onIrcLine(line: string): void;
    onIrcMessage(ircMessage: IrcMessage): void;
    private handlePING;
    private handlePONG;
    private handlePRIVMSG;
    private handleUSERSTATE;
    private handleGLOBALUSERSTATE;
    private handleUSERNOTICE;
    private handleNOTICE;
    private handleCLEARCHAT;
    private handleCLEARMSG;
    private handleROOMSTATE;
    private handleJOIN;
    private handlePART;
    private handleWHISPER;
    private handleRECONNECT;
    private handle376;
    isConnected(): this is {
        socket: WebSocket & {
            readyState: typeof WebSocket.OPEN;
        };
    };
    send(message: string): void;
    sendIrc(opts: {
        channel?: string | Channel;
    } & Omit<FormatMessage, 'channel'>): void;
    join(channelName: string | Channel): Promise<void>;
    part(channelName: string | Channel): Promise<void>;
    say(channelName: string | Channel, message: string, tags?: Record<string, any>): Promise<IrcMessage>;
    reply(channelName: string | Channel, message: string, replyParentMsgId: string, tags?: Record<string, any>): Promise<IrcMessage>;
    private generateClientNonce;
    private ping;
    private joinPendingChannels;
    private waitForCommand;
}
export {};
