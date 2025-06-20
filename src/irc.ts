import type { ChannelString, IrcMessage } from '@tmi.js/irc-parser';
import { Collection } from './lib/Collection';
import { Emote, Indices, MessageFlag } from './types';

export interface PrefixHostOnly {
	nick: undefined;
	user: undefined;
	host: string;
}

export type PrefixFull = Record<keyof PrefixHostOnly, string>;

type KnownBadges =
	| 'bits'
	| 'broadcaster'
	| 'founder'
	| 'moderator'
	| 'subscriber'
	| 'staff'
	| 'turbo'
	| 'vip';
// export type Badges = Collection<KnownBadges | string, string>;
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

// type raid = Omit<ChatMessageTags, 'firstMsg' | 'vip'> & { login: string; msgId: 'raid'; systemMsg: '4 raiders from smirkstudios have joined!' };

export namespace PRIVMSG {
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
		msgId:
			| 'highlighted-message'
			| 'skip-subs-mode-message'
			| 'gigantified-emote-message';
	}
	export interface TagsReward_Animated extends BaseTags {
		msgId: 'animated-message';
		animationId:
			| 'simmer'
			| 'rainbow-eclipse'
			| 'cosmic-abyss';
	}
	export type Tags =
		| BaseTags
		| TagsCheer
		| TagsReply
		| TagsReward_Custom
		| TagsReward_MsgId
		| TagsReward_Animated;
	export type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, [ message: string ]>;
}

export namespace USERSTATE {
	export type Command = 'USERSTATE';
	export interface Tags {
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
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, []>;
}

export namespace GLOBALUSERSTATE {
	export type Command = 'GLOBALUSERSTATE';
	export interface Tags {
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
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, '', []>;
}

export namespace USERNOTICE {
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
	/**
	 * @example `The raid has been canceled.`
	 */
	export interface TagsUnraid extends BaseTags<'unraid'> {
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
	 * @example `Combo started! You have ${number}s left to join.`
	 */
	export interface TagsOneTapStreakStarted extends BaseTags<'onetapstreakstarted'> {
		msgParamGiftId: TagType.msgParamGiftId;
		msgParamMsRemaining: TagType.msgParamMsRemaining;
	}
	/**
	 * @example `{string}'s community sent ${number}!`
	 */
	export interface TagsOneTapStreakExpired extends BaseTags<'onetapstreakexpired'> {
		msgParamChannelDisplayName: TagType.msgParamChannelDisplayName;
		msgParamContributor1Taps: TagType.msgParamContributor1Taps;
		msgParamContributor1: TagType.msgParamContributor1;
		msgParamContributor2Taps?: TagType.msgParamContributor2Taps;
		msgParamContributor2?: TagType.msgParamContributor2;
		msgParamContributor3Taps?: TagType.msgParamContributor3Taps;
		msgParamContributor3?: TagType.msgParamContributor3;
		/** `'heart' | 'awww' | 'dino'` */
		msgParamGiftId: TagType.msgParamGiftId;
		/** `1 | 2 | 3` */
		msgParamLargestContributorCount: TagType.msgParamLargestContributorCount;
		msgParamStreakSizeBits: TagType.msgParamStreakSizeBits;
		msgParamStreakSizeTaps: TagType.msgParamStreakSizeTaps;
	}
	/**
	 * @example `Milestone ${number} achieved!`
	 */
	export interface TagsOneTapBreakpointAchieved extends BaseTags<'onetapbreakpointachieved'> {
		msgParamBreakpointNumber: TagType.msgParamBreakpointNumber;
		msgParamBreakpointThresholdBits: TagType.msgParamBreakpointThresholdBits;
		/** `'heart' | 'awww' | 'dino'` */
		msgParamGiftId: TagType.msgParamGiftId;
	}
	/**
	 * @example `bits badge tier notification`
	 */
	export interface TagsBitsBadgeTier extends BaseTags<'bitsbadgetier'> {
		msgParamThreshold: TagType.msgParamThreshold;
	}
	/**
	 * @example `{string} watched {number} consecutive streams this month and sparked a watch streak!`
	 */
	export interface TagsViewerMilestone extends BaseTags<'viewermilestone'> {
		msgParamCategory: TagType.msgParamCategory;
		msgParamCopoReward: TagType.msgParamCopoReward;
		msgParamId: TagType.msgParamId;
		msgParamValue: TagType.msgParamValue;
	}
	export interface TagsSharedChatNotice extends BaseTags<'sharedchatnotice'> {
		sourceBadgeInfo: BadgeInfo;
		sourceBadges: Badges;
		sourceId: TagType.sourceId;
		sourceMsgId: TagType.sourceMsgId;
		sourceOnly: TagType.sourceOnly;
		sourceRoomId: TagType.sourceRoomId;
	}
	export type Tags =
		| TagsAnnouncement
		| TagsRaid
		| TagsUnraid
		| TagsSub
		| TagsResub
		| TagsSubGift
		| TagsSubMysteryGift
		| TagsStandardPayForward
		| TagsCommunityPayForward
		| TagsGiftPaidUpgrade
		| TagsPrimePaidUpgrade
		| TagsOneTapStreakStarted
		| TagsOneTapStreakExpired
		| TagsOneTapBreakpointAchieved
		| TagsBitsBadgeTier
		| TagsViewerMilestone
		| TagsSharedChatNotice;
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [ message: string ]>;
}

export namespace NOTICE {
	export type Command = 'NOTICE';
	export interface Tags {
		msgId?: TagType.msgId;
	}
	export type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, [ message: string, authMessage?: string ]>;
}

export namespace ROOMSTATE {
	export type Command = 'ROOMSTATE';
	export interface Tags {
		emoteOnly?: TagType.emoteOnly;
		followersOnly?: TagType.followersOnly;
		unique?: TagType.unique;
		roomId: TagType.roomId;
		slow?: TagType.slow;
		subsOnly?: TagType.subsOnly;
	}
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, []>;
}

export namespace JOIN {
	export type Command = 'JOIN';
	export interface Tags {}
	export type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, []>;
}

export namespace PART {
	export type Command = 'PART';
	export interface Tags {}
	export type IrcMessage = IM<Command, Tags, PrefixFull, ChannelString, []>;
}

export namespace CLEARCHAT {
	export type Command = 'CLEARCHAT';
	interface BaseTags {
		roomId: string;
		tmiSentTs: number;
	}
	export interface TagsClearChat extends BaseTags {}
	export interface TagsTimeout extends BaseTags {
		banDuration: TagType.banDuration;
		targetUserId: TagType.targetUserId;
	}
	export interface TagsBan extends BaseTags {
		targetUserId: TagType.targetUserId;
	}
	export type Tags = TagsClearChat | TagsTimeout | TagsBan;
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [ username?: string ]>;
}

export namespace CLEARMSG {
	export type Command = 'CLEARMSG';
	export interface Tags {
		login: TagType.login;
		roomId: TagType.roomId;
		targetMsgId: TagType.targetMsgId;
		tmiSentTs: TagType.tmiSentTs;
	}
	export type IrcMessage = IM<Command, Tags, PrefixHostOnly, ChannelString, [ message: string ]>;
}

export namespace WHISPER {
	export type Command = 'WHISPER';
	export interface Tags {
		badges: Badges;
		color: TagType.color;
		displayName: TagType.displayName;
		emotes: TagType.emotes;
		messageId: TagType.messageId;
		/**
		 * TODO: Is this order always `[ toId, fromId ]` on both sides?
		 * Two tests says yes
		 */
		threadId: [ toId: string, fromId: string ];
		turbo: TagType.turbo;
		userId: TagType.userId;
		userType: UserType;
	}
	export type IrcMessage = IM<Command, Tags, PrefixFull, '', [ targetLogin: string, message: string ]>;
}

export namespace TagType {
	// Integer
	export type banDuration = number;
	export type bits = number;
	export type msgParamBreakpointNumber = number;
	export type msgParamBreakpointThresholdBits = number;
	export type msgParamContributor1Taps = number;
	export type msgParamContributor2Taps = number;
	export type msgParamContributor3Taps = number;
	export type msgParamCopoReward = number;
	export type msgParamCumulativeMonths = number;
	export type msgParamGiftMonthBeingRedeemed = number;
	export type msgParamGiftMonths = number;
	export type msgParamGoalCurrentContributions = number;
	export type msgParamGoalTargetContributions = number;
	export type msgParamGoalUserContributions = number;
	export type msgParamLargestContributorCount = number;
	export type msgParamMassGiftCount = number;
	export type msgParamMonths = number;
	export type msgParamMsRemaining = number;
	export type msgParamMultimonthDuration = number;
	export type msgParamMultimonthTenure = number;
	export type msgParamSenderCount = number;
	export type msgParamStreakMonths = number;
	export type msgParamStreakSizeBits = number;
	export type msgParamStreakSizeTaps = number;
	export type msgParamThreshold = number;
	export type msgParamValue = number;
	export type msgParamViewerCount = number;
	export type sentTs = number;
	export type slow = number;
	export type tmiSentTs = number;

	// Literal boolean
	export type msgParamAnonGift = boolean;
	export type msgParamPriorGifterAnonymous = boolean;
	export type msgParamWasGifted = boolean;

	// Boolean number
	export type emoteOnly = boolean;
	export type firstMsg = boolean;
	export type mod = boolean;
	export type msgParamShouldShareStreak = boolean;
	export type returningChatter = boolean;
	export type subsOnly = boolean;
	export type subscriber = boolean;
	export type turbo = boolean;
	export type vip = boolean;
	export type unique = boolean;

	// Followers only
	export type followersOnly = {
		enabled: boolean;
		durationMinutes: number;
	};

	// Badges
	export type badgeInfo = BadgeInfo;
	export type badges = Badges;
	export type sourceBadgeInfo = BadgeInfo;
	export type sourceBadges = Badges;

	// Emotes
	export type emotes = Emote[];

	// Comma-separated lists
	export type emoteSets = string[];

	// Thread ID
	export type threadId = [ string, string ];

	// Flags
	export type flags = MessageFlag[];

	// Strings
	export type clientNonce = string;
	export type color = string;
	export type customRewardId = string;
	export type displayName = string;
	export type id = string;
	export type login = string;
	export type messageId = string;
	export type msgId = string;
	export type msgParamCategory = string;
	export type msgParamChannelDisplayName = string;
	export type msgParamColor = string;
	export type msgParamCommunityGiftId = string;
	export type msgParamContributor1 = string;
	export type msgParamContributor2 = string;
	export type msgParamContributor3 = string;
	export type msgParamDisplayName = string;
	export type msgParamFunString = string;
	export type msgParamGiftId = string;
	export type msgParamGiftMatch = string;
	export type msgParamGiftMatchBonusCount = number;
	export type msgParamGiftMatchExtraCount = number;
	export type msgParamGiftMatchGifterDisplayName = string;
	export type msgParamGiftTheme = string;
	export type msgParamGifterId = string;
	export type msgParamGifterLogin = string;
	export type msgParamGifterName = string;
	export type msgParamGoalContributionType = string;
	export type msgParamGoalDescription = string;
	export type msgParamId = string;
	export type msgParamLogin = string;
	export type msgParamOriginId = string;
	export type msgParamPriorGifterDisplayName = string;
	export type msgParamPriorGifterId = string;
	export type msgParamPriorGifterUserName = string;
	export type msgParamProfileImageUrl = string;
	export type msgParamRecipientDisplayName = string;
	export type msgParamRecipientId = string;
	export type msgParamRecipientUserName = string;
	export type msgParamSenderLogin = string;
	export type msgParamSenderName = string;
	export type msgParamSubPlanName = string;
	export type msgParamSubPlan = string;
	export type msgParamViewerCustomizationId = string;
	export type replyParentDisplayName = string;
	export type replyParentMsgBody = string;
	export type replyParentMsgId = string;
	export type replyParentUserId = string;
	export type replyParentUserLogin = string;
	export type replyThreadParentDisplayName = string;
	export type replyThreadParentMsgId = string;
	export type replyThreadParentUserId = string;
	export type replyThreadParentUserLogin = string;
	export type roomId = string;
	export type sourceId = string;
	export type sourceMsgId = string;
	export type sourceOnly = boolean;
	export type sourceRoomId = string;
	export type systemMsg = string;
	export type targetMsgId = string;
	export type targetUserId = string;
	export type userId = string;
	export type userType = UserType;
}

const regexKebabToCamel = /-(\w)/g;

function kebabToCamel(str: string) {
	return str.replace(regexKebabToCamel, (_, match) => match.toUpperCase());
}

export function parseTag(key: string, value: string, params: IrcMessage['params']): [ key: string, value: any ] {
	key = kebabToCamel(key);
	switch(key) {
		// Integer
		case 'banDuration':
		case 'bits':
		case 'msgParamBreakpointNumber':
		case 'msgParamBreakpointThresholdBits':
		case 'msgParamContributor1Taps':
		case 'msgParamContributor2Taps':
		case 'msgParamContributor3Taps':
		case 'msgParamCopoReward': // "msg-param-copoReward"
		case 'msgParamCumulativeMonths':
		case 'msgParamGiftMatchBonusCount':
		case 'msgParamGiftMatchExtraCount':
		case 'msgParamGiftMonthBeingRedeemed':
		case 'msgParamGiftMonths':
		case 'msgParamGoalCurrentContributions':
		case 'msgParamGoalTargetContributions':
		case 'msgParamGoalUserContributions':
		case 'msgParamLargestContributorCount':
		case 'msgParamMassGiftCount':
		case 'msgParamMonths':
		case 'msgParamMsRemaining':
		case 'msgParamMultimonthDuration':
		case 'msgParamMultimonthTenure':
		case 'msgParamSenderCount':
		case 'msgParamStreakMonths':
		case 'msgParamStreakSizeBits':
		case 'msgParamStreakSizeTaps':
		case 'msgParamThreshold':
		case 'msgParamValue':
		case 'msgParamViewerCount': // "msg-param-viewerCount"
		case 'sentTs':
		case 'slow':
		case 'tmiSentTs':
		{
			return [ key, parseInt(value, 10) ];
		}

		// Literal boolean
		case 'msgParamAnonGift':
		case 'msgParamPriorGifterAnonymous':
		case 'msgParamWasGifted':
		{
			return [ key, value === 'true' ];
		}

		// Boolean number
		case 'emoteOnly': // Occurs in ROOMSTATE and PRIVMSG
		case 'firstMsg':
		case 'mod':
		case 'msgParamShouldShareStreak':
		case 'returningChatter':
		case 'sourceOnly':
		case 'subsOnly':
		case 'subscriber':
		case 'turbo':
		case 'vip':
		{
			return [ key, value === '1' ];
		}
		case 'r9k':
		{
			return [ 'unique', value === '1' ];
		}

		// Followers only
		case 'followersOnly':
		{
			return [ key, { enabled: value !== '-1', durationMinutes: parseInt(value, 10) } ];
		}

		// Badges
		case 'badgeInfo':
		case 'badges':
		case 'sourceBadgeInfo':
		case 'sourceBadges':
		{
			if(!value) {
				return [ key, new Collection() ];
			}
			return [ key, value.split(',').reduce<Collection<string, string>>((p, badge) => {
				const [ badgeKey, version ] = badge.split('/');
				p.set(badgeKey, version);
				return p;
			}, new Collection()) ];
		}

		// Emotes
		case 'emotes': {
			if(!value) {
				return [ key, [] ];
			}
			return [ key, value.split('/').map<Emote>(emote => {
				const [ id, raw ] = emote.split(':');
				const indices = raw.split(',').map<Indices>(pos => {
					const [ start, end ] = pos.split('-');
					return [ Number(start), Number(end) + 1 ];
				});
				return { id, indices };
			}) ];
		}

		// Comma-separated lists
		case 'emoteSets': {
			return [ key, value.split(',') ];
		}

		// Thread ID
		case 'threadId': {
			return [ key, value.split('_') ];
		}

		// Flags
		case 'flags': {
			const flags: MessageFlag[] = [];
			if(!value) {
				return [ key, flags ];
			}
			const messageSplit = [ ...params[0] ];
			for(const flag of value.split(',')) {
				const [ indices, flagType ] = flag.split(':');
				const [ start, end ] = indices.split('-');
				const index: [ number, number ] = [ Number(start), Number(end) + 1 ];
				const flagTypeSplit = flagType.split('/') as unknown as [ keyof MessageFlag['flags'], '.', string ][];
				flags.push({
					index,
					flags: flagTypeSplit.reduce((p, [ type, , level ]) => {
						p[type] = Number(level);
						return p;
					}, {} as MessageFlag['flags']),
					text: messageSplit.slice(...index).join(''),
				});
			}
			return [ key, flags ];
		}

		// Strings
		case 'animationId':
		case 'clientNonce':
		case 'color':
		case 'customRewardId':
		case 'displayName':
		case 'id':
		case 'login':
		case 'messageId':
		case 'msgId':
		case 'msgParamCategory':
		case 'msgParamChannelDisplayName':
		case 'msgParamColor':
		case 'msgParamCommunityGiftId':
		case 'msgParamContributor1':
		case 'msgParamContributor2':
		case 'msgParamContributor3':
		case 'msgParamDisplayName': // "msg-param-displayName"
		case 'msgParamFunString':
		case 'msgParamGiftId':
		case 'msgParamGiftMatch':
		case 'msgParamGiftMatchGifterDisplayName':
		case 'msgParamGiftTheme':
		case 'msgParamGifterId':
		case 'msgParamGifterLogin':
		case 'msgParamGifterName':
		case 'msgParamGoalContributionType':
		case 'msgParamGoalDescription':
		case 'msgParamId':
		case 'msgParamLogin':
		case 'msgParamOriginId':
		case 'msgParamPriorGifterDisplayName':
		case 'msgParamPriorGifterId':
		case 'msgParamPriorGifterUserName':
		case 'msgParamRecipientDisplayName':
		case 'msgParamRecipientId':
		case 'msgParamRecipientUserName':
		case 'msgParamSenderLogin':
		case 'msgParamSenderName':
		case 'msgParamSubPlanName':
		case 'msgParamSubPlan':
		case 'msgParamViewerCustomizationId':
		case 'replyParentDisplayName':
		case 'replyParentMsgBody':
		case 'replyParentMsgId':
		case 'replyParentUserId':
		case 'replyParentUserLogin':
		case 'replyThreadParentDisplayName':
		case 'replyThreadParentMsgId':
		case 'replyThreadParentUserId':
		case 'replyThreadParentUserLogin':
		case 'roomId':
		case 'sourceId':
		case 'sourceMsgId':
		case 'sourceRoomId':
		case 'systemMsg':
		case 'targetMsgId':
		case 'targetUserId':
		case 'userId':
		case 'userType': {
			return [ key, value ];
		}
		case 'msgParamProfileImageURL': { // "msg-param-profileImageURL"
			return [ 'msgParamProfileImageUrl', value ];
		}
	}
	// TODO: Warn about unknown tags. Throw custom error?
	return [ key, value ];
}