import type { IrcMessage, FormatMessage } from '@tmi.js/irc-parser';
import EventEmitter from './lib/EventEmitter';
import Identity, { type TokenValue } from './lib/Identity';
import Channel, { ChannelPlaceholder } from './lib/Channel';
import * as irc from './irc';
import type { Combos, GlobalUserState, Message, Moderation, RoomState, Raid, Subscription, SharedChatNotice, Unraid, UserState, ViewerMilestone, Whisper } from './twitch/events';
export interface ClientOptions {
    token: TokenValue;
    channels: string[];
    /**
     * Set the minimum delay between sending join method calls for channels queued with the Client options or after
     * reconnecting. Defaults to `500` milliseconds.
     */
    joinDelayMs: number;
}
export type ConnectionEvents = {
    connect: void;
    close: {
        reason: string;
        code: number;
        wasCloseCalled: boolean;
    };
    socketError: Event;
    reconnecting: {
        attempts: number;
        waitTime: number;
        reason: string;
    };
    pong: void;
};
export type OtherEvents = {
    ircMessage: [ircMessage: IrcMessage];
    error: [error: Error];
};
declare namespace MessageDropped {
    interface Event {
        channel: Channel;
        reason: string;
        systemMessage: string;
        tags: irc.NOTICE.Tags;
    }
}
export type ChatEvents = {
    message: Message.Event;
    messageDropped: MessageDropped.Event;
    whisper: Whisper.Event;
    globalUserState: GlobalUserState.Event;
    userState: UserState.Event;
    roomState: RoomState.Event;
    moderation: Moderation.Event;
    raid: Raid.Event;
    unraid: Unraid.Event;
    sub: Subscription.Event;
    combos: Combos.Event;
    badgeUpgrade: Message.EventBadgeUpgrade;
    viewerMilestone: ViewerMilestone.Event;
    sharedChatNotice: SharedChatNotice.Event;
    join: {
        channel: Channel;
    };
    part: {
        channel: Channel;
    };
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
    /** The timeout ID for the reconnect timeout. */
    reconnectTimeout?: ReturnType<typeof setTimeout>;
    /** A function to cancel the current reconnect attempt. Calling this will throw an error for the reconnect caller. */
    cancelReconnect?: () => void;
}
type ToTuples<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends any[] ? T[K] : T[K] extends void ? [] : [event: T[K]];
};
export declare class Client extends EventEmitter<ToTuples<ClientEvents>> {
    socket?: WebSocket;
    readonly keepalive: Keepalive;
    channelsPendingJoin: Set<string>;
    pendingChannelJoinDelayMs: number;
    channels: Set<Channel>;
    channelsById: Map<string, Channel>;
    channelsByLogin: Map<string, Channel>;
    identity: Identity;
    didConnectAnonymously?: boolean;
    wasCloseCalled: boolean;
    constructor(opts?: Partial<ClientOptions>);
    connect(): void;
    close(): void;
    reconnect(reason?: string): Promise<void>;
    private onSocketMessage;
    private onSocketClose;
    private onSocketOpen;
    private onSocketError;
    getChannelById(id: string): Channel | undefined;
    getChannelByLogin(login: string): Channel | undefined;
    private removeChannel;
    private clearChannels;
    getChannelPlaceholder(id?: string, login?: string): ChannelPlaceholder;
    onIrcLine(line: string): void;
    onIrcMessage(ircMessage: IrcMessage): void | Promise<void>;
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
