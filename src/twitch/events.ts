import type {
	Badges, BadgeInfo, TagType, UserType,
	PRIVMSG, ROOMSTATE, USERNOTICE, WHISPER,
	GLOBALUSERSTATE,
	CLEARCHAT,
	CLEARMSG
} from '../irc';
import Channel from '../lib/Channel';
import type { Emote, MessageFlag } from '../types';

interface User {
	id: string;
	login: string;
	display: string;
}
interface UserMaybeAnon extends User {
	isAnon: boolean;
}
type UserNoId = Omit<User, 'id'>;
type UserNoIdMaybeAnon = Omit<UserMaybeAnon, 'id'>;

interface UserExtra extends User {
	color: string;
	badges: Badges;
	badgeInfo: BadgeInfo;
	isBroadcaster: boolean;
	isMod: boolean;
	isSubscriber: boolean;
	isFounder: boolean;
	isTurbo: boolean;
	isVip: boolean;
	type: UserType;
	isReturningChatter: boolean;
}
type UserExtraMaybeAnon = UserExtra & UserMaybeAnon;

// interface Channel {
// 	id: TagType.roomId;
// 	login: string;
// }

interface SharedChatTags {
	channel: Channel;
	user: {
		badges: Badges;
		badgeInfo: BadgeInfo;
	};
	message: {
		id: TagType.id;
	};
	sourceOnly: boolean;
}

export namespace Message {
	type Tags = PRIVMSG.Tags;
	type TagsCheer = PRIVMSG.TagsCheer;
	type TagsReply = PRIVMSG.TagsReply;
	type TagsAnnouncement = USERNOTICE.TagsAnnouncement;
	interface Announcement {
		color: TagsAnnouncement['msgParamColor'];
	}
	interface Cheer {
		bits: TagsCheer['bits'];
	}
	interface ReplyParent {
		id: TagsReply['replyParentMsgId'];
		text: TagsReply['replyParentMsgBody'];
		user: User;
		thread: {
			id: TagsReply['replyThreadParentMsgId'];
			user: User;
		};
	}
	interface Reward_Basic {
		type: 'highlighted' | 'skipSubs';
	}
	interface Reward_GigantifiedEmote {
		type: 'gigantifiedEmote';
		emote: Emote;
		emoteId: Emote['id'];
	}
	interface Reward_MessageEffects {
		type: 'messageEffects';
		animation: PRIVMSG.TagsReward_Animated['animationId'];
	}
	interface Reward_Custom {
		type: 'custom';
		rewardId: string;
	}
	interface Reward_Unknown {
		type: 'unknown';
		msgId: string;
	}
	type Reward =
		| Reward_Basic
		| Reward_GigantifiedEmote
		| Reward_MessageEffects
		| Reward_Custom
		| Reward_Unknown;
	interface BaseEvent {
		channel: Channel;
		user: UserExtra;
		message: {
			id: TagType.id;
			text: string;
			flags: MessageFlag[];
			emotes: Emote[];
			isAction: boolean;
			isFirst: boolean;
		};
		sharedChat?: SharedChatTags;
	}
	export interface EventRegular extends BaseEvent {
		announcement: undefined;
		cheer?: Cheer;
		parent?: ReplyParent;
		reward?: Reward;
		tags: Tags;
	}
	export interface EventAnnouncement extends BaseEvent {
		announcement: Announcement;
		cheer: undefined;
		parent: undefined;
		reward: undefined;
		tags: TagsAnnouncement;
	}
	export interface EventBadgeUpgrade extends BaseEvent {
		type: 'bits';
		threshold: number;
		tags: USERNOTICE.TagsBitsBadgeTier
	}
	export type Event = EventRegular | EventAnnouncement;
}

export namespace Whisper {
	export interface Event {
		user: User & {
			badges: TagType.badges;
			color: string;
			isTurbo: boolean;
			type: UserType;
		};
		thread: {
			id: WHISPER.Tags['threadId'];
		};
		message: {
			id: TagType.messageId;
			text: string;
			emotes: TagType.emotes;
			isAction: boolean;
		};
	}
}

export namespace GlobalUserState {
	export interface Event {
		user: Omit<User, 'login'> & {
			badges: Badges;
			/**
			 * Currently this will always be empty.
			 */
			badgeInfo: BadgeInfo;
			color: TagType.color;
			isTurbo: boolean;
			type: UserType;
		};
		emoteSets: TagType.emoteSets;
		tags: GLOBALUSERSTATE.Tags;
	}
}

export namespace UserState {
	export interface Event {
		channel: Channel;
		user: Omit<UserExtra, 'isReturningChatter'>;
		// badges: Badges;
		// badgeInfo: BadgeInfo;
		// isBroadcaster: boolean;
		// isMod: boolean;
		// isSubscriber: boolean;
		// type: UserType;
	}
}

export namespace Subscription {
	export type SubPlanTierString = USERNOTICE.SubPlanTierString;
	export type GiftTheme = USERNOTICE.GiftTheme;
	export type GoalContributionType = USERNOTICE.GoalContributionType;
	export type SubTierNumber = 1 | 2 | 3;
	export type GiftMonths = 1 | 3 | 6 | 12;
	interface SubPlan {
		name: string;
		plan: SubPlanTierString;
		tier: SubTierNumber;
		isPrime: boolean;
	}
	export interface SubPlanNoName {
		name: undefined;
		plan: SubPlanTierString;
		tier: SubTierNumber;
		isPrime: boolean;
	}
	export interface SubPlanEmpty {
		name: undefined;
		plan: undefined;
		tier: undefined;
		isPrime: boolean;
	}
	export interface Goal {
		type: GoalContributionType;
		description: TagType.msgParamGoalDescription;
		current: TagType.msgParamGoalCurrentContributions;
		target: TagType.msgParamGoalTargetContributions;
		userContributions: TagType.msgParamGoalUserContributions;
	}
	export interface EventBase<Type> {
		type: Type;
		channel: Channel;
		user: UserExtra;
	}
	export interface EventGoalBase {
		goal?: Goal;
	}
	export interface EventSub extends EventBase<'sub'>, EventGoalBase {
		plan: SubPlan;
		multiMonth: {
			duration: TagType.msgParamMultimonthDuration;
			// Tenure is always 0, useless
			// tenure: TagType.msgParamMultimonthTenure;
		};
		tags: USERNOTICE.TagsSub;
	}
	export interface EventResub extends EventBase<'resub'>, EventGoalBase {
		/** Total months the user has subscribed. */
		cumulativeMonths: TagType.msgParamCumulativeMonths;
		plan: SubPlan;
		multiMonth: {
			/**
			 * Total number of months the recurring subscription
			 */
			duration: TagType.msgParamMultimonthDuration;
			/**
			 * Number of months the subscription will recur for.
			 */
			tenure: TagType.msgParamMultimonthTenure;
		};
		/** Only present if the user has shared their streak. */
		streak?: {
			/** Number of months in the streak. */
			months: TagType.msgParamStreakMonths;
		};
		// if(tags.msgParamWasGifted)
		/** Only present if the resub was a gift. */
		gift?: {
			/** Number of months that was gifted. */
			months: GiftMonths;
			/** The month being redeemed from the gift. */
			monthBeingRedeemed: TagType.msgParamGiftMonthBeingRedeemed;
			/** The sender of the gift. */
			// msgParamAnonGift
			// msgParamGifterId
			// msgParamGifterLogin
			// msgParamGifterName
			gifter: UserMaybeAnon;
		};
		tags: USERNOTICE.TagsResub;
	}
	export interface EventSubGift extends EventBase<'subGift'>, EventGoalBase {
		/** The user who received the gift. */
		// msgParamRecipientId
		// msgParamRecipientUserName
		// msgParamRecipientDisplayName
		recipient: User;
		plan: SubPlan;
		gift: {
			/** Number of months the gift recipient will receive. */
			months: GiftMonths;
			/** A theme chosen by the user. */
			theme?: GiftTheme;
			originId: TagType.msgParamOriginId;
		};
		/** Only present if the gift was part of a sub mystery gift event (`EventSubMysteryGift`). */
		// Included with the presence of msgParamCommunityGiftId
		mystery?: {
			/** An ID for the associated mystery gift event (`EventSubMysteryGift`) at `event.mystery.id`. */
			id: TagType.msgParamCommunityGiftId;
		};
		tags: USERNOTICE.TagsSubGift;
	}
	export interface EventSubMysteryGift extends EventBase<'subMysteryGift'>, EventGoalBase {
		/** Plan name is not available */
		plan: SubPlanNoName;
		mystery: {
			/**
			 * An ID for the mystery gift event. Sub gift events (`EventSubGift`) will share this ID value at
			 * `event.mystery.id`.
			 */
			id: TagType.msgParamCommunityGiftId;
			/** Amount of subs gifted in this event. */
			count: TagType.msgParamMassGiftCount;
			/** A theme chosen by the user. */
			theme?: GiftTheme;
			/**
			 * Lifetime gift subs sent by this user in this channel. Possibly 0 if the user has this total hidden.
			 */
			gifterLifetimeCount: TagType.msgParamSenderCount;
		};
		giftMatch?: {
			type: TagType.msgParamGiftMatch;
			bonusCount: TagType.msgParamGiftMatchBonusCount;
			extraCount: TagType.msgParamGiftMatchExtraCount;
			originalGifter: TagType.msgParamGiftMatchGifterDisplayName;
		};
		tags: USERNOTICE.TagsSubMysteryGift;
	}
	export interface EventStandardPayForward extends EventBase<'standardPayForward'> {
		// msgParamRecipientId
		// msgParamRecipientUserName
		// msgParamRecipientDisplayName
		recipient: User;
		tags: USERNOTICE.TagsStandardPayForward;
	}
	export interface EventCommunityPayForward extends EventBase<'communityPayForward'> {
		priorGifter: UserMaybeAnon;
		tags: USERNOTICE.TagsCommunityPayForward;
	}
	export interface EventGiftPaidUpgrade extends EventBase<'giftPaidUpgrade'>, EventGoalBase {
		// No plan data
		// plan: SubPlanNoName;
		/** User ID of the gifter (sender) is not available */
		// isAnon: msgParamSenderLogin === ANONYMOUS_GIFTER_LOGIN;
		// msgParamSenderLogin;
		// msgParamSenderName;
		gifter: UserNoIdMaybeAnon;
		tags: USERNOTICE.TagsGiftPaidUpgrade;
	}
	export interface EventPrimePaidUpgrade extends EventBase<'primePaidUpgrade'> {
		/** Plan name is not available */
		plan: SubPlanNoName;
		tags: USERNOTICE.TagsPrimePaidUpgrade;
	}
	export type Event =
		| EventSub
		| EventResub
		| EventSubGift
		| EventSubMysteryGift
		| EventStandardPayForward
		| EventCommunityPayForward
		| EventGiftPaidUpgrade
		| EventPrimePaidUpgrade;
}

export namespace Moderation {
	export interface EventBase<Type, Tags> {
		type: Type;
		channel: Channel;
		timestamp: TagType.tmiSentTs;
		tags: Tags;
	}
	export interface EventClearChat extends EventBase<'clearChat', CLEARCHAT.TagsClearChat> {
	}
	export interface EventTimeout extends EventBase<'timeout', CLEARCHAT.TagsTimeout> {
		user: Pick<User, 'id' | 'login'>;
		duration: TagType.banDuration;
	}
	export interface EventBan extends EventBase<'ban', CLEARCHAT.TagsBan> {
		user: Pick<User, 'id' | 'login'>;
	}
	export interface EventDeleteMessage extends EventBase<'deleteMessage', CLEARMSG.Tags> {
		user: Pick<User, 'login'>;
		message: {
			id: TagType.targetMsgId;
			text: string;
		};
	}
	export type Event =
		| EventClearChat
		| EventTimeout
		| EventBan
		| EventDeleteMessage;
}

export namespace Combos {
	export interface EventBase<Type> {
		type: Type;
		/** `'heart' | 'awww' | 'dino' | 'horselul'` */
		theme: string;
		channel: Channel;
		timestamp: TagType.tmiSentTs;
	}
	export interface EventStarted extends EventBase<'started'> {
		streak: {
			msRemaining: number;
		};
		tags: USERNOTICE.TagsOneTapStreakStarted;
	}
	export interface ComboContributor {
		display: string;
		taps: number;
	}
	export interface EventExpired extends EventBase<'expired'> {
		topContributors: ComboContributor[];
		streak: {
			bits: number;
			taps: number;
		};
		tags: USERNOTICE.TagsOneTapStreakExpired;
	}
	export interface EventBreakpointAchieved extends EventBase<'breakpointAchieved'> {
		threshold: {
			level: number;
			bits: number;
		};
		tags: USERNOTICE.TagsOneTapBreakpointAchieved;
	}
	export type Event =
		| EventStarted
		| EventExpired
		| EventBreakpointAchieved;
}

export namespace Raid {
	export interface Event {
		channel: Channel;
		user: User;
		viewers: number;
		tags: USERNOTICE.TagsRaid;
	}
}

export namespace Unraid {
	export interface Event {
		channel: Channel;
		tags: USERNOTICE.TagsUnraid;
	}
}

export namespace ViewerMilestone {
	interface BaseEvent {
		channel: Channel;
		user: UserExtra;
	}
	export interface Event extends BaseEvent {
		type: TagType.msgParamCategory;
		milestone: {
			id: TagType.msgParamId;
			value: TagType.msgParamValue;
			reward: TagType.msgParamCopoReward;
		};
		tags: USERNOTICE.TagsViewerMilestone;
	}
}

export namespace SharedChatNotice {
	export interface EventBase<Type> {
		type: Type;
		channel: Channel;
		timestamp: TagType.tmiSentTs;
		sharedChat: SharedChatTags;
		tags: USERNOTICE.TagsSharedChatNotice;
	}
	export type Event =
		| EventBase<string>;
}

export namespace RoomState {
	export interface Event {
		channel: Channel;
		emoteOnly?: TagType.emoteOnly;
		followersOnly?: TagType.followersOnly;
		unique?: TagType.unique;
		slow?: TagType.slow;
		subsOnly?: TagType.subsOnly;
		tags: ROOMSTATE.Tags;
	}
}