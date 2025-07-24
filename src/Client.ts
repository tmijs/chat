import { format, parse } from '@tmi.js/irc-parser';
import type { IrcMessage, FormatMessage, ChannelString } from '@tmi.js/irc-parser';
import EventEmitter from './lib/EventEmitter';
import Identity, { type TokenValue } from './lib/Identity';
import Channel, { ChannelPlaceholder } from './lib/Channel';
import * as irc from './irc';
import type {
	Combos, GlobalUserState, Message, Moderation, RoomState, Raid, Subscription,
	SharedChatNotice, Unraid, UserState, ViewerMilestone, Whisper,
} from './twitch/events';
import type { Emote } from './types';

const ACTION_MESSAGE_PREFIX = '\u0001ACTION ';
const ACTION_MESSAGE_SUFFIX = '\u0001';

const ANONYMOUS_GIFTER_LOGIN = 'ananonymousgifter';

function getUser(tags: irc.PRIVMSG.Tags | irc.USERNOTICE.Tags) {
	return {
		id: tags.userId,
		color: tags.color,
		// login: tags.login ?? prefix.nick,
		display: tags.displayName,
		badges: tags.badges,
		badgeInfo: tags.badgeInfo,
		isBroadcaster: tags.badges.has('broadcaster'),
		isMod: tags.mod,
		isSubscriber: tags.subscriber,
		isFounder: tags.badges.has('founder'),
		isVip: 'vip' in tags && tags.vip === true,
		type: tags.userType,
		// isTurbo: 'turbo' in tags && tags.turbo === true,
		// isReturningChatter: 'returningChatter' in tags && tags.returningChatter === true
	};
}

export interface ClientOptions {
	channels: string[];
	token: TokenValue;
}

export type ConnectionEvents = {
	connect: void;
	close: { reason: string; code: number; wasCloseCalled: boolean; };
	socketError: Event;
	reconnecting: { attempts: number; waitTime: number; };
	pong: void;
};

export type OtherEvents = {
	ircMessage: [ ircMessage: IrcMessage ];
	error: [ error: Error ];
};

namespace MessageDropped {
	export interface Event {
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
	join: { channel: Channel; };
	part: { channel: Channel; };
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

type ToTuples<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends any[] ? T[K] : T[K] extends void ? [] : [ event: T[K] ];
};

export class Client extends EventEmitter<ToTuples<ClientEvents>> {
	socket?: WebSocket = undefined;
	readonly keepalive: Keepalive = {
		maxWaitTimeoutMs: 15_000,
		pingIntervalSeconds: 15,
		pingTimeoutSeconds: 10,
		reconnectAttempts: 0,
	};
	channelsPendingJoin: Set<string>;
	channels = new Set<Channel>();
	channelsById = new Map<string, Channel>();
	channelsByLogin = new Map<string, Channel>();
	identity = new Identity();
	wasCloseCalled = false;
	constructor(opts?: Partial<ClientOptions>) {
		super();
		this.channelsPendingJoin = (opts?.channels ?? []).reduce((p, n) => {
			p.add(Channel.toLogin(n));
			return p;
		}, new Set<string>());
		if(opts?.token) {
			this.identity.setToken(opts.token);
		}
	}
	connect() {
		if(this.isConnected()) {
			throw new Error('Client is already connected');
		}
		this.wasCloseCalled = false;
		const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
		this.socket = socket;
		socket.onmessage = e => this.onSocketMessage(e);
		socket.onclose = e => this.onSocketClose(e);
		socket.onopen = e => this.onSocketOpen(e);
		socket.onerror = e => this.onSocketError(e);
	}
	close() {
		this.wasCloseCalled = true;
		if(this.isConnected()) {
			this.socket.close();
		}
	}
	async reconnect() {
		if(this.isConnected()) {
			this.socket.close();
		}
		const reconnectWaitTime = Math.min(1000 * 1.23 ** this.keepalive.reconnectAttempts++, 60000);
		this.emit('reconnecting', {
			attempts: this.keepalive.reconnectAttempts,
			waitTime: reconnectWaitTime
		});
		await new Promise(resolve => setTimeout(resolve, reconnectWaitTime));
		this.connect();
	}
	private onSocketMessage(event: MessageEvent<string>) {
		event.data.trim().split('\r\n').forEach(line => this.onIrcLine(line));
	}
	private onSocketClose(event: CloseEvent) {
		clearInterval(this.keepalive.pingInterval);
		clearTimeout(this.keepalive.pingTimeout);
		this.clearChannels();
		if(!this.wasCloseCalled) {
			this.reconnect();
		}
		this.emit('close', {
			reason: event.reason,
			code: event.code,
			wasCloseCalled: this.wasCloseCalled
		});
	}
	private async onSocketOpen(event: Event) {
		this.keepalive.reconnectAttempts = 0;
		const isAnonymous = this.identity.isAnonymous();
		const token = isAnonymous ? 'schmoopiie' : `oauth:${await this.identity.getToken()}`;
		this.sendIrc({ command: 'CAP REQ', params: [ 'twitch.tv/commands', 'twitch.tv/tags' ] });
		this.sendIrc({ command: 'PASS', params: [ token ] });
		this.sendIrc({ command: 'NICK', params: [ isAnonymous ? 'justinfan123456' : 'justinfan' ] })
	}
	private onSocketError(event: Event) {
		this.emit('socketError', event);
	}
	getChannelById(id: string) {
		return this.channelsById.get(id);
	}
	getChannelByLogin(login: string) {
		return this.channelsByLogin.get(Channel.toLogin(login));
	}
	private removeChannel(channel: Channel) {
		const successA = this.channels.delete(channel);
		const successB = this.channelsById.delete(channel.id);
		const successC = this.channelsByLogin.delete(channel.login);
		return successA && successB && successC;
	}
	private clearChannels() {
		this.channels.clear();
		this.channelsById.clear();
		this.channelsByLogin.clear();
	}
	getChannelPlaceholder(id?: string, login?: string) {
		const channel = new ChannelPlaceholder(id, login);
		return channel;
	}
	onIrcLine(line: string) {
		const ircMessage = parse(line, irc.parseTag);
		if(!ircMessage) {
			return;
		}
		this.onIrcMessage(ircMessage);
	}
	onIrcMessage(ircMessage: IrcMessage) {
		this.emit('ircMessage', ircMessage);
		switch(ircMessage.command) {
			case 'PING':
				return this.handlePING(ircMessage);
			case 'PONG':
				return this.handlePONG(ircMessage);
			case 'PRIVMSG':
				return this.handlePRIVMSG(ircMessage as any);
			case 'USERSTATE':
				return this.handleUSERSTATE(ircMessage as any);
			case 'GLOBALUSERSTATE':
				return this.handleGLOBALUSERSTATE(ircMessage as any);
			case 'USERNOTICE':
				return this.handleUSERNOTICE(ircMessage as any);
			case 'NOTICE':
				return this.handleNOTICE(ircMessage as any);
			case 'CLEARCHAT':
				return this.handleCLEARCHAT(ircMessage as any);
			case 'CLEARMSG':
				return this.handleCLEARMSG(ircMessage as any);
			case 'ROOMSTATE':
				return this.handleROOMSTATE(ircMessage as any);
			case 'PART':
				return this.handlePART(ircMessage as any);
			case 'WHISPER':
				return this.handleWHISPER(ircMessage as any);
			case 'RECONNECT':
				return this.handleRECONNECT(ircMessage);
			case '376':
				return this.handle376(ircMessage);
			// Ignore these messages
			case 'CAP':
			case 'JOIN':
			case '001':
			case '002':
			case '003':
			case '004':
			case '353':
			case '366':
			case '375':
			case '372': {
				break;
			}
			default: {
				// TODO:
				break;
			}
		}
	}
	private handlePING(ircMessage: IrcMessage) {
		this.keepalive.lastPingReceivedAt = Date.now();
		this.sendIrc({ command: 'PONG', params: ircMessage.params });
	}
	private handlePONG(ircMessage: IrcMessage) {
		clearTimeout(this.keepalive.pingTimeout);
		this.keepalive.lastPongReceivedAt = Date.now();
		if(this.keepalive.lastPingSent === undefined) {
			throw new Error('Received PONG without having sent a PING');
		}
		this.keepalive.latencyMs = this.keepalive.lastPongReceivedAt - this.keepalive.lastPingSent;
		this.emit('pong');
	}
	private handlePRIVMSG({ tags, prefix, channel: channelString, params }: irc.PRIVMSG.IrcMessage) {
		type E = Message.Event;
		const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString);
		let text = params[0];
		const isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
		if(isAction) {
			text = text.slice(8, -1);
		}
		let sharedChat: E['sharedChat'];
		let cheer: E['cheer'];
		let parent: E['parent'];
		let reward: E['reward'];
		if('sourceRoomId' in tags) {
			const sharedChannel = this.getChannelById(tags.sourceRoomId!) ?? this.getChannelPlaceholder(tags.sourceRoomId, undefined);
			sharedChat = {
				channel: sharedChannel,
				user: {
					badges: tags.sourceBadges!,
					badgeInfo: tags.sourceBadgeInfo!,
				},
				message: {
					id: tags.sourceId!
				},
				sourceOnly: tags.sourceOnly!,
			};
		}
		if('bits' in tags) {
			cheer = {
				bits: tags.bits
			};
		}
		if('replyParentMsgId' in tags) {
			parent = {
				id: tags.replyParentMsgId,
				text: tags.replyParentMsgBody,
				user: {
					id: tags.replyParentUserId,
					login: tags.replyParentUserLogin,
					display: tags.replyParentDisplayName
				},
				thread: {
					id: tags.replyThreadParentMsgId,
					user: {
						id: tags.replyThreadParentUserId,
						login: tags.replyThreadParentUserLogin,
						display: tags.replyThreadParentDisplayName
					}
				}
			};
		}
		if('customRewardId' in tags && tags.customRewardId) {
			reward = {
				type: 'custom',
				rewardId: tags.customRewardId
			};
		}
		else if('msgId' in tags && tags.msgId) {
			switch(tags.msgId) {
				case 'highlighted-message': {
					reward = { type: 'highlighted' };
					break;
				}
				case 'skip-subs-mode-message': {
					reward = { type: 'skipSubs' };
					break;
				}
				case 'gigantified-emote-message': {
					let finalEmote: Emote;
					const getEmote = () => {
						if(finalEmote) {
							return finalEmote;
						}
						if(!tags.emotes.length) {
							throw new Error('No emotes found in gigantified emote message');
						}
						let _finalEmote: Emote = tags.emotes[0];
						let finalIndex = _finalEmote.indices.at(-1)![1];
						for(let i = 1; i < tags.emotes.length; i++) {
							const emote = tags.emotes[i];
							const emoteIndex = emote.indices.at(-1)![1];
							if(emoteIndex > finalIndex) {
								finalEmote = emote;
								finalIndex = emoteIndex;
							}
						}
						finalEmote = _finalEmote;
						return finalEmote;
					};
					reward = {
						type: 'gigantifiedEmote',
						get emote() {
							return getEmote();
						},
						get emoteId() {
							return getEmote().id;
						},
					};
					break;
				}
				case 'animated-message': {
					reward = {
						type: 'messageEffects',
						animation: tags.animationId
					};
					break;
				}
				default: {
					reward = {
						type: 'unknown',
						msgId: (tags as { msgId: string; }).msgId
					};
					break;
				}
			}
		}
		this.emit('message', {
			channel,
			user: {
				...getUser(tags),
				login: prefix.nick,
				isTurbo: tags.turbo,
				isReturningChatter: tags.returningChatter
			},
			message: {
				id: tags.id,
				text,
				flags: tags.flags,
				emotes: tags.emotes,
				isAction,
				isFirst: tags.firstMsg
			},
			sharedChat,
			announcement: undefined,
			cheer,
			parent,
			reward,
			tags
		});
	}
	private handleUSERSTATE({ tags, channel: channelName }: irc.USERSTATE.IrcMessage) {
		const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(undefined, channelName);
		const user = {
			id: this.identity.id!,
			color: tags.color,
			login: this.identity.name!,
			display: tags.displayName,
			badges: tags.badges,
			badgeInfo: tags.badgeInfo,
			isBroadcaster: tags.badges.has('broadcaster'),
			isMod: tags.mod,
			isSubscriber: tags.subscriber,
			isFounder: tags.badges.has('founder'),
			isTurbo: tags.badges.has('turbo'),
			isVip: tags.badges.has('vip'),
			type: tags.userType,
		};
		channel.lastUserstate = {
			user,
		};
		this.emit('userState', {
			channel,
			user,
		});
	}
	private handleGLOBALUSERSTATE({ tags }: irc.GLOBALUSERSTATE.IrcMessage) {
		this.identity.id = tags.userId;
		this.emit('globalUserState', {
			user: {
				id: tags.userId,
				display: tags.displayName,
				color: tags.color,
				badges: tags.badges,
				badgeInfo: tags.badgeInfo,
				isTurbo: tags.badges.has('turbo'),
				type: tags.userType,
			},
			emoteSets: tags.emoteSets,
			tags
		});
	}
	private handleUSERNOTICE({ tags, channel: channelString, params }: irc.USERNOTICE.IrcMessage) {
		const text = params[0];
		const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString);
		const user = {
			...getUser(tags),
			login: tags.login,
			isTurbo: 'turbo' in tags && tags.turbo === true,
			isReturningChatter: 'returningChatter' in tags && tags.returningChatter === true
		};
		let goal: Subscription.Goal | undefined;
		if('msgParamGoalContributionType' in tags && tags.msgParamGoalContributionType) {
			goal = {
				type: tags.msgParamGoalContributionType,
				description: tags.msgParamGoalDescription ?? '',
				current: tags.msgParamGoalCurrentContributions!,
				target: tags.msgParamGoalTargetContributions!,
				userContributions: tags.msgParamGoalUserContributions!
			};
		}
		const PRIME = 'Prime';
		const getTier = (plan: irc.TagType.msgParamSubPlan) => {
			if(typeof plan !== 'string' || plan === PRIME) {
				return 1;
			}
			return parseInt(plan.slice(0, 1)) as Subscription.SubTierNumber;
		};
		switch(tags.msgId) {
			case 'announcement': {
				this.emit('message', {
					channel,
					user,
					message: {
						id: tags.id,
						text,
						flags: tags.flags,
						emotes: tags.emotes,
						isAction: false,
						isFirst: 'firstMsg' in tags && tags.firstMsg === true
					},
					sharedChat: undefined,
					announcement: {
						color: tags.msgParamColor
					},
					cheer: undefined,
					parent: undefined,
					reward: undefined,
					tags
				});
				break;
			}
			case 'sub': {
				type E = Subscription.EventSub;
				this.emit('sub', {
					type: 'sub',
					channel,
					user,
					plan: {
						name: tags.msgParamSubPlanName,
						plan: tags.msgParamSubPlan,
						tier: getTier(tags.msgParamSubPlan),
						isPrime: tags.msgParamSubPlan === PRIME
					},
					multiMonth: {
						duration: tags.msgParamMultimonthDuration ?? 0
					},
					goal,
					tags
				});
				break;
			}
			case 'resub': {
				type E = Subscription.EventResub;
				let streak: E['streak'];
				let gift: E['gift'];
				if(tags.msgParamShouldShareStreak) {
					streak = {
						months: tags.msgParamStreakMonths!
					};
				}
				if(tags.msgParamWasGifted) {
					gift = {
						monthBeingRedeemed: tags.msgParamGiftMonthBeingRedeemed!,
						months: tags.msgParamGiftMonths as Subscription.GiftMonths,
						gifter: {
							isAnon: tags.msgParamAnonGift!,
							id: tags.msgParamGifterId!,
							login: tags.msgParamGifterLogin!,
							display: tags.msgParamGifterName!
						}
					};
				}
				this.emit('sub', {
					type: 'resub',
					channel,
					user,
					cumulativeMonths: tags.msgParamCumulativeMonths,
					multiMonth: {
						duration: tags.msgParamMultimonthDuration ?? 0,
						tenure: tags.msgParamMultimonthTenure ?? 0
					},
					streak,
					plan: {
						name: tags.msgParamSubPlanName,
						plan: tags.msgParamSubPlan,
						tier: getTier(tags.msgParamSubPlan),
						isPrime: tags.msgParamSubPlan === PRIME
					},
					gift,
					tags
				});
				break;
			}
			case 'subgift': {
				type E = Subscription.EventSubGift;
				let mystery: E['mystery'];
				if(tags.msgParamCommunityGiftId) {
					mystery = {
						id: tags.msgParamCommunityGiftId
					};
				}
				this.emit('sub', {
					type: 'subGift',
					channel,
					user,
					recipient: {
						id: tags.msgParamRecipientId,
						login: tags.msgParamRecipientUserName,
						display: tags.msgParamRecipientDisplayName
					},
					plan: {
						name: tags.msgParamSubPlanName,
						plan: tags.msgParamSubPlan,
						tier: getTier(tags.msgParamSubPlan),
						isPrime: tags.msgParamSubPlan === PRIME
					},
					gift: {
						months: tags.msgParamGiftMonths as Subscription.GiftMonths,
						theme: tags.msgParamGiftTheme,
						originId: tags.msgParamOriginId,
					},
					mystery,
					goal,
					tags
				});
				break;
			}
			case 'submysterygift': {
				let giftMatch: Subscription.EventSubMysteryGift['giftMatch'];
				if('msgParamGiftMatch' in tags) {
					giftMatch = {
						type: tags.msgParamGiftMatch,
						bonusCount: tags.msgParamGiftMatchBonusCount,
						extraCount: tags.msgParamGiftMatchExtraCount,
						originalGifter: tags.msgParamGiftMatchGifterDisplayName
					};
				}
				this.emit('sub', {
					type: 'subMysteryGift',
					channel,
					user,
					plan: {
						name: undefined,
						plan: tags.msgParamSubPlan,
						tier: getTier(tags.msgParamSubPlan),
						isPrime: false
					},
					mystery: {
						id: tags.msgParamCommunityGiftId,
						count: tags.msgParamMassGiftCount,
						theme: tags.msgParamGiftTheme,
						gifterLifetimeCount: tags.msgParamSenderCount
					},
					giftMatch,
					goal,
					tags
				});
				break;
			}
			case 'standardpayforward': {
				this.emit('sub', {
					type: 'standardPayForward',
					channel,
					user,
					recipient: {
						id: tags.msgParamRecipientId,
						login: tags.msgParamRecipientUserName,
						display: tags.msgParamRecipientDisplayName
					},
					tags
				});
				break;
			}
			case 'communitypayforward': {
				this.emit('sub', {
					type: 'communityPayForward',
					channel,
					user,
					priorGifter: {
						isAnon: tags.msgParamPriorGifterAnonymous,
						id: tags.msgParamPriorGifterId,
						login: tags.msgParamPriorGifterUserName,
						display: tags.msgParamPriorGifterDisplayName
					},
					tags
				});
				break;
			}
			case 'giftpaidupgrade': {
				this.emit('sub', {
					type: 'giftPaidUpgrade',
					channel,
					user,
					gifter: {
						isAnon: tags.msgParamSenderLogin === ANONYMOUS_GIFTER_LOGIN,
						login: tags.msgParamSenderLogin,
						display: tags.msgParamSenderName
					},
					goal,
					tags
				});
				break;
			}
			case 'primepaidupgrade': {
				this.emit('sub', {
					type: 'primePaidUpgrade',
					channel,
					user,
					plan: {
						name: undefined,
						plan: tags.msgParamSubPlan,
						tier: getTier(tags.msgParamSubPlan),
						isPrime: false
					},
					tags
				});
				break;
			}
			case 'onetapstreakstarted': {
				this.emit('combos', {
					type: 'started',
					channel,
					timestamp: tags.tmiSentTs,
					theme: tags.msgParamGiftId,
					streak: {
						msRemaining: tags.msgParamMsRemaining,
					},
					tags
				});
				break;
			}
			case 'onetapstreakexpired': {
				const topContributors: Combos.EventExpired['topContributors'] = [];
				const addContributor = (display?: string, taps?: number) => {
					if(display && taps) {
						topContributors.push({ display, taps });
					}
				};
				addContributor(tags.msgParamContributor1, tags.msgParamContributor1Taps);
				addContributor(tags.msgParamContributor2, tags.msgParamContributor2Taps);
				addContributor(tags.msgParamContributor3, tags.msgParamContributor3Taps);
				this.emit('combos', {
					type: 'expired',
					channel,
					timestamp: tags.tmiSentTs,
					theme: tags.msgParamGiftId,
					streak: {
						bits: tags.msgParamStreakSizeBits,
						taps: tags.msgParamStreakSizeTaps,
					},
					topContributors,
					tags
				});
				break;
			}
			case 'onetapbreakpointachieved': {
				this.emit('combos', {
					type: 'breakpointAchieved',
					channel,
					timestamp: tags.tmiSentTs,
					theme: tags.msgParamGiftId,
					threshold: {
						level: tags.msgParamBreakpointNumber,
						bits: tags.msgParamBreakpointThresholdBits,
					},
					tags
				});
				break;
			}
			case 'raid': {
				this.emit('raid', {
					channel,
					user: {
						...getUser(tags),
						login: tags.msgParamLogin,
						// isTurbo: 'turbo' in tags && tags.turbo === true,
						// isReturningChatter: 'returningChatter' in tags && tags.returningChatter === true
					},
					viewers: tags.msgParamViewerCount,
					tags
				});
				break;
			}
			case 'unraid': {
				this.emit('unraid', {
					channel,
					tags
				});
				break;
			}
			case 'bitsbadgetier': {
				this.emit('badgeUpgrade', {
					channel,
					user,
					type: 'bits',
					threshold: tags.msgParamThreshold,
					tags,
					message: {
						id: tags.id,
						text,
						flags: tags.flags,
						emotes: tags.emotes,
						isAction: false,
						isFirst: 'firstMsg' in tags && tags.firstMsg === true
					},
				});
				break;
			}
			case 'viewermilestone': {
				this.emit('viewerMilestone', {
					channel,
					user,
					type: tags.msgParamCategory,
					milestone: {
						id: tags.msgParamId,
						value: tags.msgParamValue,
						reward: tags.msgParamCopoReward
					},
					tags,
				});
				break;
			}
			case 'sharedchatnotice': {
				const sharedChannel = this.getChannelById(tags.sourceRoomId!) ?? this.getChannelPlaceholder(tags.sourceRoomId, undefined);
				const sharedChat: SharedChatNotice.Event['sharedChat'] = {
					channel: sharedChannel,
					user: {
						badges: tags.sourceBadges!,
						badgeInfo: tags.sourceBadgeInfo!,
					},
					message: {
						id: tags.sourceId!
					},
					sourceOnly: tags.sourceOnly ?? false,
				};
				this.emit('sharedChatNotice', {
					type: tags.sourceMsgId,
					channel,
					sharedChat,
					timestamp: tags.tmiSentTs,
					tags
				});
				break;
			}
		}
	}
	private handleNOTICE({ channel: channelName, tags, params }: irc.NOTICE.IrcMessage) {
		const { msgId } = tags;
		if(!msgId) {
			const message = params[1];
			this.close();
			switch(message) {
				case 'Login authentication failed':
					// ':tmi.twitch.tv NOTICE * :Login authentication failed'
					break;
				case 'Improperly formatted auth':
					// ':tmi.twitch.tv NOTICE * :Improperly formatted auth'
					const error = new Error(`Catatrophic error: ${message}`);
					this.emit('error', error);
			}
			return;
		}
		const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(undefined, channelName);
		switch(msgId) {
			// Ignored messages
			case 'emote_only_on':
			case 'emote_only_off':
			case 'followers_on_zero':
			case 'followers_on':
			case 'followers_off':
			case 'r9k_on':
			case 'r9k_off':
			case 'slow_on':
			case 'slow_off':
			case 'subs_on':
			case 'subs_off':
				break;

			// Messages that mean a sent message was dropped
			case 'msg_channel_suspended':
			case 'msg_duplicate':
			case 'msg_timedout':
			case 'unrecognized_cmd':
				this.emit('messageDropped', {
					channel,
					reason: msgId,
					systemMessage: params[0] ?? '',
					tags
				});
				break;
		}
	}
	private handleCLEARCHAT({ channel: channelName, tags, params }: irc.CLEARCHAT.IrcMessage) {
		type E = Moderation.Event;
		const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName);
		const timestamp = tags.tmiSentTs;
		if('banDuration' in tags) {
			this.emit('moderation', {
				type: 'timeout',
				channel,
				duration: tags.banDuration,
				user: {
					id: tags.targetUserId,
					login: params[0]!
				},
				timestamp,
				tags
			});
		}
		else if('targetUserId' in tags) {
			this.emit('moderation', {
				type: 'ban',
				channel,
				user: {
					id: tags.targetUserId,
					login: params[0]!
				},
				timestamp,
				tags
			});
		}
		else {
			this.emit('moderation', {
				type: 'clearChat',
				channel,
				timestamp,
				tags
			});
		}
	}
	private handleCLEARMSG({ tags, channel: channelName, params }: irc.CLEARMSG.IrcMessage) {
		type E = Moderation.EventDeleteMessage;
		const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName);
		this.emit('moderation', {
			type: 'deleteMessage',
			channel,
			user: {
				login: tags.login,
			},
			message: {
				id: tags.targetMsgId,
				text: params[0]
			},
			timestamp: tags.tmiSentTs,
			tags
		});
	}
	private handleROOMSTATE({ tags, channel: channelName }: irc.ROOMSTATE.IrcMessage) {
		let channel = this.getChannelById(tags.roomId);
		if(!channel) {
			channel = new Channel(tags.roomId, channelName);
			this.channels.add(channel);
			this.channelsById.set(channel.id, channel);
			this.channelsByLogin.set(channel.login, channel);
			this.emit('join', { channel });
		}
		this.emit('roomState', {
			channel,
			emoteOnly: tags.emoteOnly,
			followersOnly: tags.followersOnly,
			unique: tags.unique,
			slow: tags.slow,
			subsOnly: tags.subsOnly,
			tags
		});
	}
	private handlePART({ channel: channelName }: irc.PART.IrcMessage) {
		const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(undefined, channelName);
		this.removeChannel(channel);
		this.emit('part', {
			channel
		});
	}
	private handleWHISPER({ tags, prefix, params }: irc.WHISPER.IrcMessage) {
		let text = params[1];
		const isAction = text.startsWith('/me ');
		if(isAction) {
			text = text.slice(4);
		}
		this.emit('whisper', {
			user: {
				id: tags.userId,
				login: prefix.nick,
				display: tags.displayName,
				color: tags.color,
				badges: tags.badges,
				isTurbo: tags.turbo,
				type: tags.userType
			},
			thread: {
				id: tags.threadId
			},
			message: {
				id: tags.messageId,
				text,
				emotes: tags.emotes,
				isAction
			}
		});
	}
	private handleRECONNECT(ircMessage: IrcMessage) {
		// TODO:
		this.reconnect();
	}
	private handle376(ircMessage: IrcMessage) {
		this.identity.name = ircMessage.params[0];
		this.emit('connect');
		this.joinPendingChannels();
	}

	isConnected(): this is { socket: WebSocket & { readyState: typeof WebSocket.OPEN; }; } {
		return !!this.socket && this.socket.readyState === WebSocket.OPEN;
	}
	send(message: string) {
		if(!this.isConnected()) {
			throw new Error('Not connected');
		}
		this.socket.send(message);
	}
	sendIrc(opts: { channel?: string | Channel; } & Omit<FormatMessage, 'channel'>) {
		const result = format({
			...opts,
			channel: opts.channel?.toString()
		});
		if(!result) {
			throw new Error('Result message is empty');
		}
		this.send(result);
	}
	async join(channelName: string | Channel) {
		const channel = typeof channelName === 'string' ? Channel.toIrc(channelName) : channelName.toString();
		const responder = this.waitForCommand<irc.JOIN.IrcMessage | irc.USERSTATE.IrcMessage>(
			this.identity.isAnonymous() ? 'JOIN' : 'USERSTATE',
			m => m.prefix.nick ? m.prefix.nick === this.identity.name : true,
			{ channelHint: channel }
		);
		this.sendIrc({ command: 'JOIN', channel });
		await responder;
	}
	async part(channelName: string | Channel) {
		const channel = typeof channelName === 'string' ? Channel.toIrc(channelName) : channelName.toString();
		const responder = this.waitForCommand<irc.PART.IrcMessage>(
			'PART',
			m => m.prefix.nick === this.identity.name,
			{ channelHint: channel }
		);
		this.sendIrc({ command: 'PART', channel });
		await responder;
	}
	async say(channelName: string | Channel, message: string, tags: Record<string, any> = {}) {
		if(message.length === 0) {
			throw new Error('Message cannot be empty');
		}
		else if(message.length > 500) {
			throw new Error('Message is too long (max 500 characters)');
		}
		const finalTags = {
			'client-nonce': this.generateClientNonce(),
			...tags
		};
		// Allow the user to specify the client-nonce
		const clientNonce = finalTags['client-nonce'];
		const responder = this.waitForCommand<irc.USERSTATE.IrcMessage>(
			'USERSTATE',
			m => m.tags.clientNonce === clientNonce,
			{ channelHint: Channel.toIrc(channelName) }
		);
		this.sendIrc({
			command: 'PRIVMSG',
			channel: channelName,
			params: [ message ],
			tags: finalTags
		});
		return await responder;
	}
	async reply(channelName: string | Channel, message: string, replyParentMsgId: string, tags: Record<string, any> = {}) {
		return this.say(channelName, message, {
			'reply-parent-msg-id': replyParentMsgId,
			...tags
		});
	}
	private generateClientNonce() {
		const nonce = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
		return `tmi.js-${nonce}`;
	}
	private ping() {
		this.keepalive.lastPingSent = Date.now();
		this.sendIrc({ command: 'PING' });
		this.keepalive.pingTimeout = setTimeout(() => this.reconnect(), this.keepalive.pingTimeoutSeconds * 1000);
	}
	private async joinPendingChannels() {
		for(const channel of this.channelsPendingJoin) {
			try {
				await this.join(channel);
			} catch(err) {
				const newError = new Error('Failed to join channel', { cause: err });
				this.emit('error', newError);
			}
		}
	}
	private waitForCommand<Command extends IrcMessage>(
		command: Command['command'],
		filterCallback?: (ircMessage: Command) => boolean,
		opts?: {
			failOnDrop?: boolean;
			channelHint?: ChannelString;
			timeoutMs?: number;
		}
	) {
		return new Promise<IrcMessage>((resolve, reject) => {
			const failOnDrop = opts?.failOnDrop ?? true;
			const timeoutMs = opts?.timeoutMs ?? Math.max(1000, Math.min(this.keepalive.maxWaitTimeoutMs, (this.keepalive.latencyMs ?? 500) * 2));
			const channelHint = opts?.channelHint;
			const commandListener = (ircMessage: IrcMessage) => {
				if(
					ircMessage.command === command &&
					(!channelHint || ircMessage.channel === channelHint) &&
					(!filterCallback || filterCallback(ircMessage as Command))
				) {
					stop();
					clearTimeout(timeout);
					resolve(ircMessage);
				}
			};
			const dropListener = (event: MessageDropped.Event) => {
				if(channelHint && event.channel.toString() !== channelHint) {
					return;
				}
				stop();
				reject(new Error(`Message dropped: ${event.reason}`, { cause: event }));
			};
			const stop = () => {
				this.off('ircMessage', commandListener);
				if(failOnDrop) {
					this.off('messageDropped', dropListener);
				}
			};
			const timeout = setTimeout(() => {
				stop();
				const err = new Error(
					`Did not receive command in time (Command: ${command}, Waited: ${timeoutMs}ms)`,
					{ cause: command }
				);
				reject(err);
			}, timeoutMs);
			timeout.unref?.();
			this.on('ircMessage', commandListener);
			if(failOnDrop) {
				this.on('messageDropped', dropListener);
			}
		});
	}
}