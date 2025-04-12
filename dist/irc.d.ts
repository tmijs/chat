import type { ChannelString, IrcMessage } from '@tmi.js/irc-parser';
import { Collection } from './lib/Collection';
import { Emote, MessageFlag } from './types';
export interface PrefixHostOnly {
    nick: undefined;
    user: undefined;
    host: string;
}
export type PrefixFull = Record<keyof PrefixHostOnly, string>;
type KnownBadges = 'bits' | 'broadcaster' | 'founder' | 'moderator' | 'subscriber' | 'staff' | 'turbo' | 'vip';
export type Badges = Collection<KnownBadges, string>;
export type BadgeInfo = Collection<'subscriber', string>;
export type UserType = '' | 'admin' | 'global_mod' | 'mod' | 'staff';
type IM<Command, Tags, Prefix, Channel, Params> = {
    command: Command;
    tags: Tags;
    prefix: Prefix;
    channel: Channel;
    params: Params;
    raw: string;
    rawTags: Record<string, string>;
};
interface ChatMessageTags {
    badgeInfo: BadgeInfo;
    badges: Badges;
    color: TagType.color;
    displayName: TagType.displayName;
    emotes: TagType.emotes;
    firstMsg: TagType.firstMsg;
    flags: TagType.flags;
    id: TagType.id;
    mod: TagType.mod;
    roomId: TagType.roomId;
    subscriber: TagType.subscriber;
    tmiSentTs: TagType.tmiSentTs;
    userId: TagType.userId;
    userType: UserType;
    vip?: TagType.vip;
}
export declare namespace PRIVMSG {
    export type Command = 'PRIVMSG';
    interface BaseTags extends ChatMessageTags {
        clientNonce?: TagType.clientNonce;
        color: TagType.color;
        displayName: TagType.displayName;
        emotes: TagType.emotes;
        firstMsg: TagType.firstMsg;
        flags: TagType.flags;
        id: TagType.id;
        mod: TagType.mod;
        returningChatter: TagType.returningChatter;
        roomId: TagType.roomId;
        sourceBadgeInfo?: BadgeInfo;
        sourceBadges?: Badges;
        sourceId?: TagType.sourceId;
        sourceOnly?: TagType.sourceOnly;
        sourceRoomId?: TagType.sourceRoomId;
        subscriber: TagType.subscriber;
        tmiSentTs: TagType.tmiSentTs;
        turbo: TagType.turbo;
    }
    export interface TagsCheer extends BaseTags {
        bits: TagType.bits;
    }
    export interface TagsReply extends BaseTags {
        replyParentMsgId: TagType.replyParentMsgId;
        replyParentMsgBody: TagType.replyParentMsgBody;
        replyParentUserId: TagType.replyParentUserId;
        replyParentUserLogin: TagType.replyParentUserLogin;
        replyParentDisplayName: TagType.replyParentDisplayName;
        replyThreadParentMsgId: TagType.replyThreadParentMsgId;
        replyThreadParentUserId: TagType.replyThreadParentUserId;
        replyThreadParentUserLogin: TagType.replyThreadParentUserLogin;
        replyThreadParentDisplayName: TagType.replyThreadParentDisplayName;
    }
    export interface TagsReward_Custom extends BaseTags {
        customRewardId: TagType.customRewardId;
    }
    export interface TagsReward_MsgId extends BaseTags {
        msgId: 'highlighted-message' | 'skip-subs-mode-message' | 'gigantified-emote-message';
    }
    export interface TagsReward_Animated extends BaseTags {
        msgId: 'animated-message';
        animationId: 'simmer' | 'rainbow-eclipse' | 'cosmic-abyss';
    }
    export type Tags = BaseTags | TagsCheer | TagsReply | TagsReward_Custom | TagsReward_MsgId | TagsReward_Animated;
    export type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, [message: string]>;
    export {};
}
export declare namespace USERSTATE {
    type Command = 'USERSTATE';
    interface Tags {
        badgeInfo: BadgeInfo;
        badges: Badges;
        clientNonce?: TagType.clientNonce;
        color: TagType.color;
        displayName: TagType.displayName;
        emoteSets: TagType.emoteSets;
        id?: TagType.id;
        mod: TagType.mod;
        subscriber: TagType.subscriber;
        userType: UserType;
    }
    type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, []>;
}
export declare namespace GLOBALUSERSTATE {
    type Command = 'GLOBALUSERSTATE';
    interface Tags {
        /**
         * Should be empty.
         */
        badgeInfo: BadgeInfo;
        badges: Badges;
        color: TagType.color;
        displayName: TagType.displayName;
        emoteSets: TagType.emoteSets;
        userId: TagType.userId;
        userType: UserType;
    }
    type IrcMessage = IM<Command, Tags, PrefixHostOnly, '', []>;
}
export declare namespace USERNOTICE {
    export type Command = 'USERNOTICE';
    export interface BaseTags<MsgId> extends Omit<ChatMessageTags, 'firstMsg'> {
        login: TagType.login;
        msgId: MsgId;
        systemMsg: TagType.systemMsg;
    }
    export type AnnounceColor = 'PRIMARY' | 'BLUE' | 'GREEN' | 'ORANGE' | 'PURPLE';
    export interface TagsAnnouncement extends BaseTags<'announcement'> {
        msgParamColor: AnnounceColor;
        systemMsg: '';
    }
    export interface TagsRaid extends BaseTags<'raid'> {
        /** Duplicate data */
        msgParamDisplayName: TagType.msgParamDisplayName;
        /** Duplicate data */
        msgParamLogin: TagType.msgParamLogin;
        /** Replace "%s" with resolution (300x300, 600x600, etc.) */
        msgParamProfileImageUrl: TagType.msgParamProfileImageUrl;
        msgParamViewerCount: TagType.msgParamViewerCount;
    }
    interface BaseTags_Goal {
        msgParamGoalContributionType: GoalContributionType;
        msgParamGoalCurrentContributions: TagType.msgParamGoalCurrentContributions;
        msgParamGoalDescription: TagType.msgParamGoalDescription;
        msgParamGoalTargetContributions: TagType.msgParamGoalTargetContributions;
        msgParamGoalUserContributions: TagType.msgParamGoalUserContributions;
    }
    export type SubPlanTierString = '1000' | '2000' | '3000' | 'Prime';
    export type GoalContributionType = 'SUB_POINTS' | 'SUBS' | 'NEW_SUB_POINTS' | 'NEW_SUBS';
    export type GiftTheme = 'showlove' | 'party' | 'lul' | 'biblethump';
    export interface TagsSub extends BaseTags<'sub'>, Partial<BaseTags_Goal> {
        /**
         * Always `1`
         */
        msgParamCumulativeMonths: TagType.msgParamCumulativeMonths;
        /**
         * Always `1` (seemingly)
         *
         * @todo Is this the user's total contributions towards this goal? Or just the change in this event? Case being
         * someone gifting subs prior to subscribing themselves.
         */
        msgParamGoalUserContributions?: TagType.msgParamGoalUserContributions;
        /**
         * @deprecated Always `0`
         */
        msgParamMonths: TagType.msgParamMonths;
        msgParamMultimonthDuration: TagType.msgParamMultimonthDuration;
        /**
         * Always `0`
         */
        msgParamMultimonthTenure: TagType.msgParamMultimonthTenure;
        /**
         * Always `false`
         */
        msgParamShouldShareStreak: TagType.msgParamShouldShareStreak;
        msgParamSubPlanName: TagType.msgParamSubPlanName;
        msgParamSubPlan: SubPlanTierString;
        /**
         * Always `false`
         */
        msgParamWasGifted: TagType.msgParamWasGifted;
    }
    /**
     * @example `${string} subscribed at Tier ${number}. They've subscribed for ${number} months!`
     * @todo Can this include goal data? Seems likely but unconfirmed.
     */
    export interface TagsResub extends BaseTags<'resub'> {
        msgParamAnonGift?: boolean;
        msgParamCumulativeMonths: number;
        msgParamGiftMonthBeingRedeemed?: number;
        /**
         * `1`, `3`, `6`, `12`
         */
        msgParamGiftMonths?: TagType.msgParamGiftMonths;
        msgParamGifterId?: string;
        msgParamGifterLogin?: string;
        msgParamGifterName?: string;
        /**
         * @deprecated Always `0`
         */
        msgParamMonths: 0;
        /**
         * Very rare to be missing, but is possible in <0.05% of the time.
         */
        msgParamMultimonthDuration?: number;
        /**
         * Very rare to be missing, but is possible in <0.05% of the time.
         */
        msgParamMultimonthTenure?: number;
        msgParamShouldShareStreak: boolean;
        msgParamStreakMonths?: number;
        msgParamSubPlanName: string;
        msgParamSubPlan: SubPlanTierString;
        msgParamWasGifted: boolean;
    }
    export interface TagsSubGift extends BaseTags<'subgift'>, Partial<BaseTags_Goal> {
        /**
         * An ID that can be used to tie this message with a submysterygift event. Only present if this subgift is part
         * of a submysterygift event. This will be the same as the msgParamOriginId value.
         */
        msgParamCommunityGiftId?: TagType.msgParamCommunityGiftId;
        /**
         * Seemingly useless
         * @type {`FunString${'One' | 'Three' | 'Four' | 'Five'}`}
         */
        msgParamFunString?: TagType.msgParamFunString;
        /**
         * `1`, `3`, `6`, `12`
         */
        msgParamGiftMonths: TagType.msgParamGiftMonths;
        msgParamGiftTheme?: GiftTheme;
        /**
         * @deprecated Always `0`
         */
        msgParamMonths: TagType.msgParamMonths;
        msgParamOriginId: TagType.msgParamOriginId;
        msgParamRecipientDisplayName: TagType.msgParamRecipientDisplayName;
        msgParamRecipientId: TagType.msgParamRecipientId;
        msgParamRecipientUserName: TagType.msgParamRecipientUserName;
        /**
         * Lifetime subscriptions sent by this user. Possibly 0 if the user has this total hidden.
         */
        msgParamSenderCount: TagType.msgParamSenderCount;
        msgParamSubPlanName: TagType.msgParamSubPlanName;
        msgParamSubPlan: SubPlanTierString;
    }
    export interface TagsSubMysteryGift extends BaseTags<'submysterygift'>, Partial<BaseTags_Goal> {
        /**
         * An ID that can be used to tie this message with subgift events.
         */
        msgParamCommunityGiftId: TagType.msgParamCommunityGiftId;
        msgParamGiftMatch: TagType.msgParamGiftMatch;
        msgParamGiftMatchBonusCount: TagType.msgParamGiftMatchBonusCount;
        msgParamGiftMatchExtraCount: TagType.msgParamGiftMatchExtraCount;
        msgParamGiftMatchGifterDisplayName: TagType.msgParamGiftMatchGifterDisplayName;
        msgParamGiftTheme?: GiftTheme;
        /**
         * The amount of subgift messages that were part of this submysterygift event.
         */
        msgParamMassGiftCount: TagType.msgParamMassGiftCount;
        msgParamOriginId: TagType.msgParamOriginId;
        /**
         * Lifetime subscriptions sent by this user. Possibly 0 if the user has this total hidden.
         */
        msgParamSenderCount: TagType.msgParamSenderCount;
        msgParamSubPlan: SubPlanTierString;
    }
    /**
     * Tags included in both standard and community pay forward events.
     */
    interface BaseTags_PayForward {
        msgParamPriorGifterAnonymous: TagType.msgParamPriorGifterAnonymous;
        msgParamPriorGifterDisplayName: TagType.msgParamPriorGifterDisplayName;
        msgParamPriorGifterId: TagType.msgParamPriorGifterId;
        msgParamPriorGifterUserName: TagType.msgParamPriorGifterUserName;
    }
    /**
     * @example `${string} is paying forward the Gift they got from ${string} to ${string}!`
     */
    export interface TagsStandardPayForward extends BaseTags<'standardpayforward'>, BaseTags_PayForward {
        msgParamRecipientDisplayName: TagType.msgParamRecipientDisplayName;
        msgParamRecipientId: TagType.msgParamRecipientId;
        msgParamRecipientUserName: TagType.msgParamRecipientUserName;
    }
    /**
     * @example `${string} is paying forward the Gift they got from ${string} to the community!`
     */
    export interface TagsCommunityPayForward extends BaseTags<'communitypayforward'>, BaseTags_PayForward {
        msgParamPriorGifterAnonymous: TagType.msgParamPriorGifterAnonymous;
        msgParamPriorGifterDisplayName: TagType.msgParamPriorGifterDisplayName;
        msgParamPriorGifterId: TagType.msgParamPriorGifterId;
        msgParamPriorGifterUserName: TagType.msgParamPriorGifterUserName;
    }
    export interface TagsGiftPaidUpgrade extends BaseTags<'giftpaidupgrade'> {
        msgParamSenderLogin: TagType.msgParamSenderLogin;
        msgParamSenderName: TagType.msgParamSenderName;
    }
    /**
     * @example `${string} converted from a Prime sub to a Tier ${number} sub!`
     */
    export interface TagsPrimePaidUpgrade extends BaseTags<'primepaidupgrade'> {
        msgParamSubPlan: Exclude<SubPlanTierString, 'Prime'>;
    }
    /**
     * @example `bits badge tier notification`
     */
    export interface TagsBitsBadgeTier extends BaseTags<'bitsbadgetier'> {
        msgParamThreshold: TagType.msgParamThreshold;
    }
    export interface TagsSharedChatNotice extends BaseTags<'sharedchatnotice'> {
        sourceBadgeInfo: BadgeInfo;
        sourceBadges: Badges;
        sourceId: TagType.sourceId;
        sourceMsgId: TagType.sourceMsgId;
        sourceOnly: TagType.sourceOnly;
        sourceRoomId: TagType.sourceRoomId;
    }
    export type Tags = TagsAnnouncement | TagsRaid | TagsSub | TagsResub | TagsSubGift | TagsSubMysteryGift | TagsStandardPayForward | TagsCommunityPayForward | TagsGiftPaidUpgrade | TagsPrimePaidUpgrade | TagsBitsBadgeTier | TagsSharedChatNotice;
    export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [message: string]>;
    export {};
}
export declare namespace NOTICE {
    type Command = 'NOTICE';
    interface Tags {
        msgId?: TagType.msgId;
    }
    type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, [message: string, authMessage?: string]>;
}
export declare namespace ROOMSTATE {
    type Command = 'ROOMSTATE';
    interface Tags {
        emoteOnly?: TagType.emoteOnly;
        followersOnly?: TagType.followersOnly;
        unique?: TagType.unique;
        roomId: TagType.roomId;
        slow?: TagType.slow;
        subsOnly?: TagType.subsOnly;
    }
    type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, []>;
}
export declare namespace JOIN {
    type Command = 'JOIN';
    interface Tags {
    }
    type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, []>;
}
export declare namespace PART {
    type Command = 'PART';
    interface Tags {
    }
    type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, []>;
}
export declare namespace CLEARCHAT {
    export type Command = 'CLEARCHAT';
    interface BaseTags {
        roomId: string;
        tmiSentTs: number;
    }
    export interface TagsClearChat extends BaseTags {
    }
    export interface TagsTimeout extends BaseTags {
        banDuration: TagType.banDuration;
        targetUserId: TagType.targetUserId;
    }
    export interface TagsBan extends BaseTags {
        targetUserId: TagType.targetUserId;
    }
    export type Tags = TagsClearChat | TagsTimeout | TagsBan;
    export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [username?: string]>;
    export {};
}
export declare namespace CLEARMSG {
    type Command = 'CLEARMSG';
    interface Tags {
        login: TagType.login;
        roomId: TagType.roomId;
        targetMsgId: TagType.targetMsgId;
        tmiSentTs: TagType.tmiSentTs;
    }
    type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [message: string]>;
}
export declare namespace WHISPER {
    type Command = 'WHISPER';
    interface Tags {
        badges: Badges;
        color: TagType.color;
        displayName: TagType.displayName;
        emotes: TagType.emotes;
        messageId: TagType.messageId;
        /**
         * TODO: Is this order always `[ toId, fromId ]` on both sides?
         * Two tests says yes
         */
        threadId: [toId: string, fromId: string];
        turbo: TagType.turbo;
        userId: TagType.userId;
        userType: UserType;
    }
    type IrcMessage = IM<Command, Tags, PrefixFull, '', [targetLogin: string, message: string]>;
}
export declare namespace TagType {
    type banDuration = number;
    type bits = number;
    type msgParamCopoReward = number;
    type msgParamCumulativeMonths = number;
    type msgParamGiftMonthBeingRedeemed = number;
    type msgParamGiftMonths = number;
    type msgParamGoalCurrentContributions = number;
    type msgParamGoalTargetContributions = number;
    type msgParamGoalUserContributions = number;
    type msgParamMassGiftCount = number;
    type msgParamMonths = number;
    type msgParamMultimonthDuration = number;
    type msgParamMultimonthTenure = number;
    type msgParamSenderCount = number;
    type msgParamStreakMonths = number;
    type msgParamThreshold = number;
    type msgParamValue = number;
    type msgParamViewerCount = number;
    type sentTs = number;
    type slow = number;
    type tmiSentTs = number;
    type msgParamAnonGift = boolean;
    type msgParamPriorGifterAnonymous = boolean;
    type msgParamWasGifted = boolean;
    type emoteOnly = boolean;
    type firstMsg = boolean;
    type mod = boolean;
    type msgParamShouldShareStreak = boolean;
    type returningChatter = boolean;
    type subsOnly = boolean;
    type subscriber = boolean;
    type turbo = boolean;
    type vip = boolean;
    type unique = boolean;
    type followersOnly = {
        enabled: boolean;
        durationMinutes: number;
    };
    type badgeInfo = BadgeInfo;
    type badges = Badges;
    type sourceBadgeInfo = BadgeInfo;
    type sourceBadges = Badges;
    type emotes = Emote[];
    type emoteSets = string[];
    type threadId = [string, string];
    type flags = MessageFlag[];
    type clientNonce = string;
    type color = string;
    type customRewardId = string;
    type displayName = string;
    type id = string;
    type login = string;
    type messageId = string;
    type msgId = string;
    type msgParamCategory = string;
    type msgParamColor = string;
    type msgParamCommunityGiftId = string;
    type msgParamDisplayName = string;
    type msgParamFunString = string;
    type msgParamGiftMatch = string;
    type msgParamGiftMatchBonusCount = number;
    type msgParamGiftMatchExtraCount = number;
    type msgParamGiftMatchGifterDisplayName = string;
    type msgParamGiftTheme = string;
    type msgParamGifterId = string;
    type msgParamGifterLogin = string;
    type msgParamGifterName = string;
    type msgParamGoalContributionType = string;
    type msgParamGoalDescription = string;
    type msgParamId = string;
    type msgParamLogin = string;
    type msgParamOriginId = string;
    type msgParamPriorGifterDisplayName = string;
    type msgParamPriorGifterId = string;
    type msgParamPriorGifterUserName = string;
    type msgParamProfileImageUrl = string;
    type msgParamRecipientDisplayName = string;
    type msgParamRecipientId = string;
    type msgParamRecipientUserName = string;
    type msgParamSenderLogin = string;
    type msgParamSenderName = string;
    type msgParamSubPlanName = string;
    type msgParamSubPlan = string;
    type msgParamViewerCustomizationId = string;
    type replyParentDisplayName = string;
    type replyParentMsgBody = string;
    type replyParentMsgId = string;
    type replyParentUserId = string;
    type replyParentUserLogin = string;
    type replyThreadParentDisplayName = string;
    type replyThreadParentMsgId = string;
    type replyThreadParentUserId = string;
    type replyThreadParentUserLogin = string;
    type roomId = string;
    type sourceId = string;
    type sourceMsgId = string;
    type sourceOnly = boolean;
    type sourceRoomId = string;
    type systemMsg = string;
    type targetMsgId = string;
    type targetUserId = string;
    type userId = string;
    type userType = UserType;
}
export declare function parseTag(key: string, value: string, params: IrcMessage['params']): [key: string, value: any];
export {};
