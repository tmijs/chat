// src/Client.ts
import { format, parse } from "@tmi.js/irc-parser";

// src/lib/EventEmitter.ts
var EventEmitter = class {
  listeners = /* @__PURE__ */ new Map();
  on(event, listener) {
    return this.listeners.has(event) || this.listeners.set(event, /* @__PURE__ */ new Set()), this.listeners.get(event).add(listener), this;
  }
  off(event, listener) {
    return this.listeners.get(event)?.delete(listener), this;
  }
  emit(event, ...args) {
    if (!this.listeners.has(event)) {
      if (event === "error")
        throw args[0] instanceof Error ? args[0] : new Error("Uncaught error emitted", { cause: args[0] });
      return !1;
    }
    for (let listener of this.listeners.get(event))
      listener(...args);
    return !0;
  }
};

// src/lib/Identity.ts
var Identity = class _Identity {
  name;
  id;
  token;
  static normalizeToken(value) {
    return typeof value == "string" && value.toLowerCase().startsWith("oauth:") && (value = value.slice(6)), value;
  }
  isAnonymous() {
    return !this.token || typeof this.token == "string" && this.token.trim() === "";
  }
  setToken(value) {
    this.token = typeof value == "string" ? _Identity.normalizeToken(value) : value;
  }
  async getToken() {
    if (typeof this.token == "string")
      return this.token;
    if (typeof this.token == "function") {
      let value = await this.token();
      return _Identity.normalizeToken(value);
    } else
      throw new Error("Invalid token");
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    let name = this.name ? `"${this.name}"` : "undefined", id = this.id ? `"${this.id}"` : this.id === "" ? '""' : "undefined", token = this.token ? typeof this.token == "string" ? this.token === "" ? '""' : "[hidden]" : "[hidden function]" : "undefined";
    return `Identity { name: ${name}, id: ${id}, token: ${token} }`;
  }
};

// src/lib/Channel.ts
var Channel = class _Channel {
  constructor(_id, _login) {
    this._id = _id;
    this._login = _login;
    this.id = _id, this.login = _login;
  }
  static toLogin(channelName) {
    let name = channelName.trim().toLowerCase();
    return name.startsWith("#") ? name.slice(1) : name;
  }
  static toIrc(channelName) {
    return channelName instanceof _Channel ? `#${channelName.login}` : `#${_Channel.toLogin(channelName)}`;
  }
  lastUserstate = null;
  set id(value) {
    if (typeof value != "string")
      throw new TypeError("Channel#id must be a string");
    this._id = value;
  }
  get id() {
    return this._id;
  }
  set login(value) {
    if (typeof value != "string")
      throw new TypeError("Channel#login must be a string");
    this._login = _Channel.toLogin(value);
  }
  get login() {
    return this._login;
  }
  toString() {
    return _Channel.toIrc(this._login);
  }
}, ChannelPlaceholder = class extends Channel {
  constructor(id, login) {
    if (id === void 0 && login)
      id = `unknownId:login(${Channel.toLogin(login)})`;
    else if (login === void 0 && id)
      login = `unknownLogin:id(${id})`;
    else if (id === void 0 && login === void 0)
      throw new Error("ChannelPlaceholder must have either id or login");
    super(id, login);
  }
};

// src/lib/Collection.ts
var Collection = class extends Map {
  toJSON() {
    return [...this.entries()];
  }
};

// src/irc.ts
var regexKebabToCamel = /-(\w)/g;
function kebabToCamel(str) {
  return str.replace(regexKebabToCamel, (_, match) => match.toUpperCase());
}
function parseTag(key, value, params) {
  switch (key = kebabToCamel(key), key) {
    // Integer
    case "banDuration":
    case "bits":
    case "msgParamBitsSpent":
    case "msgParamBreakpointNumber":
    case "msgParamBreakpointThresholdBits":
    case "msgParamContributor1Taps":
    case "msgParamContributor2Taps":
    case "msgParamContributor3Taps":
    case "msgParamCopoReward":
    // "msg-param-copoReward"
    case "msgParamCumulativeMonths":
    case "msgParamCurrentBadgeLevel":
    case "msgParamGiftMatchBonusCount":
    case "msgParamGiftMatchExtraCount":
    case "msgParamGiftMonthBeingRedeemed":
    case "msgParamGiftMonths":
    case "msgParamGoalCurrentContributions":
    case "msgParamGoalTargetContributions":
    case "msgParamGoalUserContributions":
    case "msgParamLargestContributorCount":
    case "msgParamMassGiftCount":
    case "msgParamMonths":
    case "msgParamMsRemaining":
    case "msgParamMultimonthDuration":
    case "msgParamMultimonthTenure":
    case "msgParamSenderCount":
    case "msgParamStreakMonths":
    case "msgParamStreakSizeBits":
    case "msgParamStreakSizeTaps":
    case "msgParamThreshold":
    case "msgParamValue":
    case "msgParamViewerCount":
    // "msg-param-viewerCount"
    case "sentTs":
    case "slow":
    case "tmiSentTs":
      return [key, parseInt(value, 10)];
    // Literal boolean
    case "msgParamAnonGift":
    case "msgParamPriorGifterAnonymous":
    case "msgParamWasGifted":
      return [key, value === "true"];
    // Boolean number
    case "emoteOnly":
    // Occurs in ROOMSTATE and PRIVMSG
    case "firstMsg":
    case "mod":
    case "msgParamShouldShareStreak":
    case "returningChatter":
    case "sourceOnly":
    case "subsOnly":
    case "subscriber":
    case "turbo":
    case "vip":
      return [key, value === "1"];
    case "r9k":
      return ["unique", value === "1"];
    // Followers only
    case "followersOnly":
      return [key, { enabled: value !== "-1", durationMinutes: parseInt(value, 10) }];
    // Badges
    case "badgeInfo":
    case "badges":
    case "sourceBadgeInfo":
    case "sourceBadges":
      return value ? [key, value.split(",").reduce((p, badge) => {
        let [badgeKey, version] = badge.split("/");
        return p.set(badgeKey, version), p;
      }, new Collection())] : [key, new Collection()];
    // Emotes
    case "emotes":
      return value ? [key, value.split("/").map((emote) => {
        let [id, raw] = emote.split(":"), indices = raw.split(",").map((pos) => {
          let [start, end] = pos.split("-");
          return [Number(start), Number(end) + 1];
        });
        return { id, indices };
      })] : [key, []];
    // Comma-separated lists
    case "emoteSets":
      return [key, value.split(",")];
    // Thread ID
    case "threadId":
      return [key, value.split("_")];
    // Flags
    case "flags": {
      let flags = [];
      if (!value)
        return [key, flags];
      let messageSplit = [...params[0]];
      for (let flag of value.split(",")) {
        let [indices, flagType] = flag.split(":"), [start, end] = indices.split("-"), index = [Number(start), Number(end) + 1], flagTypeSplit = flagType.split("/");
        flags.push({
          index,
          flags: flagTypeSplit.reduce((p, [type, , level]) => (p[type] = Number(level), p), {}),
          text: messageSplit.slice(...index).join("")
        });
      }
      return [key, flags];
    }
    // Strings
    case "animationId":
    case "clientNonce":
    case "color":
    case "customRewardId":
    case "displayName":
    case "id":
    case "login":
    case "messageId":
    case "msgId":
    case "msgParamCategory":
    case "msgParamChannelDisplayName":
    case "msgParamColor":
    case "msgParamCommunityGiftId":
    case "msgParamContributor1":
    case "msgParamContributor2":
    case "msgParamContributor3":
    case "msgParamDisplayName":
    // "msg-param-displayName"
    case "msgParamFunString":
    case "msgParamGiftId":
    case "msgParamGiftMatch":
    case "msgParamGiftMatchGifterDisplayName":
    case "msgParamGiftTheme":
    case "msgParamGifterId":
    case "msgParamGifterLogin":
    case "msgParamGifterName":
    case "msgParamGoalContributionType":
    case "msgParamGoalDescription":
    case "msgParamId":
    case "msgParamLogin":
    case "msgParamOriginId":
    case "msgParamPriorGifterDisplayName":
    case "msgParamPriorGifterId":
    case "msgParamPriorGifterUserName":
    case "msgParamRecipientDisplayName":
    case "msgParamRecipientId":
    case "msgParamRecipientUserName":
    case "msgParamSenderLogin":
    case "msgParamSenderName":
    case "msgParamSubPlanName":
    case "msgParamSubPlan":
    case "msgParamUserDisplayName":
    case "msgParamViewerCustomizationId":
    case "replyParentDisplayName":
    case "replyParentMsgBody":
    case "replyParentMsgId":
    case "replyParentUserId":
    case "replyParentUserLogin":
    case "replyThreadParentDisplayName":
    case "replyThreadParentMsgId":
    case "replyThreadParentUserId":
    case "replyThreadParentUserLogin":
    case "roomId":
    case "sourceId":
    case "sourceMsgId":
    case "sourceRoomId":
    case "systemMsg":
    case "targetMsgId":
    case "targetUserId":
    case "userId":
    case "userType":
      return [key, value];
    case "msgParamProfileImageURL":
      return ["msgParamProfileImageUrl", value];
  }
  return [key, value];
}

// src/Client.ts
var ACTION_MESSAGE_PREFIX = "ACTION ", ACTION_MESSAGE_SUFFIX = "", ANONYMOUS_GIFTER_LOGIN = "ananonymousgifter";
function getUser(tags) {
  return {
    id: tags.userId,
    color: tags.color,
    display: tags.displayName,
    badges: tags.badges,
    badgeInfo: tags.badgeInfo,
    isBot: tags.badges.has("bot-badge"),
    isBroadcaster: tags.badges.has("broadcaster"),
    isMod: tags.mod,
    isSubscriber: tags.subscriber,
    isFounder: tags.badges.has("founder"),
    isVip: "vip" in tags && tags.vip === !0,
    type: tags.userType
  };
}
var Client = class extends EventEmitter {
  socket = void 0;
  keepalive = {
    maxWaitTimeoutMs: 15e3,
    pingIntervalSeconds: 15,
    pingTimeoutSeconds: 10,
    reconnectAttempts: 0
  };
  channelsPendingJoin;
  pendingChannelJoinDelayMs = 1e4 / 20;
  channels = /* @__PURE__ */ new Set();
  channelsById = /* @__PURE__ */ new Map();
  channelsByLogin = /* @__PURE__ */ new Map();
  identity = new Identity();
  didConnectAnonymously;
  wasCloseCalled = !1;
  constructor(opts) {
    super(), this.channelsPendingJoin = (opts?.channels ?? []).reduce((p, n) => (p.add(Channel.toLogin(n)), p), /* @__PURE__ */ new Set()), opts?.token && this.identity.setToken(opts.token), opts?.joinDelayMs !== void 0 && (this.pendingChannelJoinDelayMs = opts.joinDelayMs);
  }
  connect() {
    if (this.isConnected())
      throw new Error("Client is already connected");
    this.wasCloseCalled = !1, this.didConnectAnonymously = void 0;
    let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    this.socket = socket, socket.onmessage = (e) => this.onSocketMessage(e), socket.onclose = (e) => this.onSocketClose(e), socket.onopen = (e) => this.onSocketOpen(e), socket.onerror = (e) => this.onSocketError(e);
  }
  close() {
    this.wasCloseCalled = !0, this.isConnected() && this.socket.close();
  }
  async reconnect(reason = "reconnect called") {
    if (this.keepalive.reconnectTimeout)
      throw new Error("Cannot reconnect while already reconnecting");
    this.close();
    let reconnectWaitTime = Math.min(1e3 * 1.23 ** this.keepalive.reconnectAttempts++, 6e4);
    this.emit("reconnecting", {
      attempts: this.keepalive.reconnectAttempts,
      waitTime: reconnectWaitTime,
      reason
    });
    let hasSettled = !1, resolve, reject, promise = new Promise((res, rej) => {
      resolve = res, reject = rej;
    });
    this.keepalive.cancelReconnect = () => {
      this.keepalive.reconnectTimeout && (clearTimeout(this.keepalive.reconnectTimeout), this.keepalive.reconnectTimeout = void 0), hasSettled || (hasSettled = !0, reject(new Error("Reconnect cancelled")));
    }, this.keepalive.reconnectTimeout = setTimeout(() => {
      this.keepalive.cancelReconnect = void 0, this.keepalive.reconnectTimeout = void 0, hasSettled || (hasSettled = !0, this.connect(), resolve());
    }, reconnectWaitTime);
    try {
      await promise;
    } catch (err) {
      throw this.keepalive.reconnectTimeout && clearTimeout(this.keepalive.reconnectTimeout), this.keepalive.cancelReconnect = void 0, this.keepalive.reconnectTimeout = void 0, err;
    }
  }
  onSocketMessage(event) {
    event.data.trim().split(`\r
`).forEach((line) => this.onIrcLine(line));
  }
  onSocketClose(event) {
    clearInterval(this.keepalive.pingInterval), clearTimeout(this.keepalive.pingTimeout), this.clearChannels(), !this.wasCloseCalled && !this.keepalive.cancelReconnect && this.reconnect("Socket was closed unexpectedly").catch((err) => {
      this.emit("error", err);
    }), this.emit("close", {
      reason: event.reason,
      code: event.code,
      wasCloseCalled: this.wasCloseCalled
    });
  }
  async onSocketOpen(event) {
    this.keepalive.reconnectAttempts = 0;
    let isAnon = this.identity.isAnonymous(), tokenAnonDefault = "schmoopiie", token = isAnon ? tokenAnonDefault : `oauth:${await this.identity.getToken()}`;
    token || ([isAnon, token] = [!0, tokenAnonDefault]), this.didConnectAnonymously = isAnon, this.sendIrc({ command: "CAP REQ", params: ["twitch.tv/commands", "twitch.tv/tags"] }), this.sendIrc({ command: "PASS", params: [token] }), this.sendIrc({ command: "NICK", params: [isAnon ? "justinfan123456" : "justinfan"] });
  }
  onSocketError(event) {
    this.emit("socketError", event);
  }
  getChannelById(id) {
    return this.channelsById.get(id);
  }
  getChannelByLogin(login) {
    return this.channelsByLogin.get(Channel.toLogin(login));
  }
  removeChannel(channel) {
    let successA = this.channels.delete(channel), successB = this.channelsById.delete(channel.id), successC = this.channelsByLogin.delete(channel.login);
    return successA && successB && successC;
  }
  clearChannels() {
    this.channels.clear(), this.channelsById.clear(), this.channelsByLogin.clear();
  }
  getChannelPlaceholder(id, login) {
    return new ChannelPlaceholder(id, login);
  }
  onIrcLine(line) {
    let ircMessage = parse(line, parseTag);
    ircMessage && this.onIrcMessage(ircMessage);
  }
  onIrcMessage(ircMessage) {
    switch (this.emit("ircMessage", ircMessage), ircMessage.command) {
      case "PING":
        return this.handlePING(ircMessage);
      case "PONG":
        return this.handlePONG(ircMessage);
      case "PRIVMSG":
        return this.handlePRIVMSG(ircMessage);
      case "USERSTATE":
        return this.handleUSERSTATE(ircMessage);
      case "GLOBALUSERSTATE":
        return this.handleGLOBALUSERSTATE(ircMessage);
      case "USERNOTICE":
        return this.handleUSERNOTICE(ircMessage);
      case "NOTICE":
        return this.handleNOTICE(ircMessage);
      case "CLEARCHAT":
        return this.handleCLEARCHAT(ircMessage);
      case "CLEARMSG":
        return this.handleCLEARMSG(ircMessage);
      case "ROOMSTATE":
        return this.handleROOMSTATE(ircMessage);
      case "PART":
        return this.handlePART(ircMessage);
      case "WHISPER":
        return this.handleWHISPER(ircMessage);
      case "RECONNECT":
        return this.handleRECONNECT(ircMessage);
      case "376":
        return this.handle376(ircMessage);
      // Ignore these messages
      case "CAP":
      case "JOIN":
      case "001":
      case "002":
      case "003":
      case "004":
      case "353":
      case "366":
      case "375":
      case "372":
        break;
      default:
        break;
    }
  }
  handlePING(ircMessage) {
    this.keepalive.lastPingReceivedAt = Date.now(), this.sendIrc({ command: "PONG", params: ircMessage.params });
  }
  handlePONG(ircMessage) {
    if (clearTimeout(this.keepalive.pingTimeout), this.keepalive.lastPongReceivedAt = Date.now(), this.keepalive.lastPingSent === void 0)
      throw new Error("Received PONG without having sent a PING");
    this.keepalive.latencyMs = this.keepalive.lastPongReceivedAt - this.keepalive.lastPingSent, this.emit("pong");
  }
  handlePRIVMSG({ tags, prefix, channel: channelString, params }) {
    let channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString), text = params[0], isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
    isAction && (text = text.slice(8, -1));
    let sharedChat, cheer, parent, reward;
    if ("sourceRoomId" in tags && (sharedChat = {
      channel: this.getChannelById(tags.sourceRoomId) ?? this.getChannelPlaceholder(tags.sourceRoomId, void 0),
      user: {
        badges: tags.sourceBadges,
        badgeInfo: tags.sourceBadgeInfo
      },
      message: {
        id: tags.sourceId
      },
      sourceOnly: tags.sourceOnly
    }), "bits" in tags && (cheer = {
      bits: tags.bits
    }), "replyParentMsgId" in tags && (parent = {
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
    }), "customRewardId" in tags && tags.customRewardId)
      reward = {
        type: "custom",
        rewardId: tags.customRewardId
      };
    else if ("msgId" in tags && tags.msgId)
      switch (tags.msgId) {
        case "highlighted-message": {
          reward = { type: "highlighted" };
          break;
        }
        case "skip-subs-mode-message": {
          reward = { type: "skipSubs" };
          break;
        }
        case "gigantified-emote-message": {
          let finalEmote, getEmote = () => {
            if (finalEmote)
              return finalEmote;
            if (!tags.emotes.length)
              throw new Error("No emotes found in gigantified emote message");
            let _finalEmote = tags.emotes[0], finalIndex = _finalEmote.indices.at(-1)[1];
            for (let i = 1; i < tags.emotes.length; i++) {
              let emote = tags.emotes[i], emoteIndex = emote.indices.at(-1)[1];
              emoteIndex > finalIndex && (finalEmote = emote, finalIndex = emoteIndex);
            }
            return finalEmote = _finalEmote, finalEmote;
          };
          reward = {
            type: "gigantifiedEmote",
            get emote() {
              return getEmote();
            },
            get emoteId() {
              return getEmote().id;
            }
          };
          break;
        }
        case "animated-message": {
          reward = {
            type: "messageEffects",
            animation: tags.animationId
          };
          break;
        }
        default: {
          reward = {
            type: "unknown",
            msgId: tags.msgId
          };
          break;
        }
      }
    this.emit("message", {
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
      announcement: void 0,
      cheer,
      parent,
      reward,
      tags
    });
  }
  handleUSERSTATE({ tags, channel: channelName }) {
    let channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName), user = {
      id: this.identity.id,
      color: tags.color,
      login: this.identity.name,
      display: tags.displayName,
      badges: tags.badges,
      badgeInfo: tags.badgeInfo,
      isBot: tags.badges.has("bot-badge"),
      isBroadcaster: tags.badges.has("broadcaster"),
      isMod: tags.mod,
      isSubscriber: tags.subscriber,
      isFounder: tags.badges.has("founder"),
      isTurbo: tags.badges.has("turbo"),
      isVip: tags.badges.has("vip"),
      type: tags.userType
    };
    channel.lastUserstate = {
      user
    }, this.emit("userState", {
      channel,
      user
    });
  }
  handleGLOBALUSERSTATE({ tags }) {
    this.identity.id = tags.userId, this.emit("globalUserState", {
      user: {
        id: tags.userId,
        display: tags.displayName,
        color: tags.color,
        badges: tags.badges,
        badgeInfo: tags.badgeInfo,
        isTurbo: tags.badges.has("turbo"),
        type: tags.userType
      },
      emoteSets: tags.emoteSets,
      tags
    });
  }
  handleUSERNOTICE({ tags, channel: channelString, params }) {
    let channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString), text = params[0] ?? "", isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
    isAction && (text = text.slice(8, -1));
    let user = {
      ...getUser(tags),
      login: tags.login,
      isTurbo: "turbo" in tags && tags.turbo === !0,
      isReturningChatter: "returningChatter" in tags && tags.returningChatter === !0
    }, goal;
    "msgParamGoalContributionType" in tags && tags.msgParamGoalContributionType && (goal = {
      type: tags.msgParamGoalContributionType,
      description: tags.msgParamGoalDescription ?? "",
      current: tags.msgParamGoalCurrentContributions,
      target: tags.msgParamGoalTargetContributions,
      userContributions: tags.msgParamGoalUserContributions
    });
    let PRIME = "Prime", getTier = (plan) => typeof plan != "string" || plan === PRIME ? 1 : parseInt(plan.slice(0, 1));
    switch (tags.msgId) {
      case "announcement": {
        this.emit("message", {
          channel,
          user,
          message: {
            id: tags.id,
            text,
            flags: tags.flags,
            emotes: tags.emotes,
            isAction,
            isFirst: "firstMsg" in tags && tags.firstMsg === !0
          },
          sharedChat: void 0,
          announcement: {
            color: tags.msgParamColor
          },
          cheer: void 0,
          parent: void 0,
          reward: void 0,
          tags
        });
        break;
      }
      case "sub": {
        this.emit("sub", {
          type: "sub",
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
      case "resub": {
        let streak, gift;
        tags.msgParamShouldShareStreak && (streak = {
          months: tags.msgParamStreakMonths
        }), tags.msgParamWasGifted && (gift = {
          monthBeingRedeemed: tags.msgParamGiftMonthBeingRedeemed,
          months: tags.msgParamGiftMonths,
          gifter: {
            isAnon: tags.msgParamAnonGift,
            id: tags.msgParamGifterId,
            login: tags.msgParamGifterLogin,
            display: tags.msgParamGifterName
          }
        }), this.emit("sub", {
          type: "resub",
          channel,
          user,
          message: {
            id: tags.id,
            text,
            flags: tags.flags,
            emotes: tags.emotes,
            isAction
          },
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
      case "subgift": {
        let mystery;
        tags.msgParamCommunityGiftId && (mystery = {
          id: tags.msgParamCommunityGiftId
        }), this.emit("sub", {
          type: "subGift",
          channel,
          user,
          recipient: {
            id: tags.msgParamRecipientId,
            login: tags.msgParamRecipientUserName,
            display: tags.msgParamRecipientDisplayName
          },
          cumulativeMonths: tags.msgParamMonths,
          plan: {
            name: tags.msgParamSubPlanName,
            plan: tags.msgParamSubPlan,
            tier: getTier(tags.msgParamSubPlan),
            isPrime: tags.msgParamSubPlan === PRIME
          },
          gift: {
            months: tags.msgParamGiftMonths,
            theme: tags.msgParamGiftTheme,
            originId: tags.msgParamOriginId
          },
          mystery,
          goal,
          tags
        });
        break;
      }
      case "submysterygift": {
        let giftMatch;
        "msgParamGiftMatch" in tags && (giftMatch = {
          type: tags.msgParamGiftMatch,
          bonusCount: tags.msgParamGiftMatchBonusCount,
          extraCount: tags.msgParamGiftMatchExtraCount,
          originalGifter: tags.msgParamGiftMatchGifterDisplayName
        }), this.emit("sub", {
          type: "subMysteryGift",
          channel,
          user,
          plan: {
            name: void 0,
            plan: tags.msgParamSubPlan,
            tier: getTier(tags.msgParamSubPlan),
            isPrime: !1
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
      case "standardpayforward": {
        this.emit("sub", {
          type: "standardPayForward",
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
      case "communitypayforward": {
        this.emit("sub", {
          type: "communityPayForward",
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
      case "giftpaidupgrade": {
        this.emit("sub", {
          type: "giftPaidUpgrade",
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
      case "primepaidupgrade": {
        this.emit("sub", {
          type: "primePaidUpgrade",
          channel,
          user,
          plan: {
            name: void 0,
            plan: tags.msgParamSubPlan,
            tier: getTier(tags.msgParamSubPlan),
            isPrime: !1
          },
          tags
        });
        break;
      }
      case "onetapstreakstarted": {
        this.emit("combos", {
          type: "started",
          channel,
          timestamp: tags.tmiSentTs,
          theme: tags.msgParamGiftId,
          streak: {
            msRemaining: tags.msgParamMsRemaining
          },
          tags
        });
        break;
      }
      case "onetapstreakexpired": {
        let topContributors = [], addContributor = (display, taps) => {
          display && taps && topContributors.push({ display, taps });
        };
        addContributor(tags.msgParamContributor1, tags.msgParamContributor1Taps), addContributor(tags.msgParamContributor2, tags.msgParamContributor2Taps), addContributor(tags.msgParamContributor3, tags.msgParamContributor3Taps), this.emit("combos", {
          type: "expired",
          channel,
          timestamp: tags.tmiSentTs,
          theme: tags.msgParamGiftId,
          streak: {
            bits: tags.msgParamStreakSizeBits,
            taps: tags.msgParamStreakSizeTaps
          },
          topContributors,
          tags
        });
        break;
      }
      case "onetapbreakpointachieved": {
        this.emit("combos", {
          type: "breakpointAchieved",
          channel,
          timestamp: tags.tmiSentTs,
          theme: tags.msgParamGiftId,
          threshold: {
            level: tags.msgParamBreakpointNumber,
            bits: tags.msgParamBreakpointThresholdBits
          },
          tags
        });
        break;
      }
      case "onetapgiftredeemed": {
        this.emit("combos", {
          type: "redeem",
          channel,
          user,
          timestamp: tags.tmiSentTs,
          theme: tags.msgParamGiftId,
          bits: tags.msgParamBitsSpent,
          tags
        });
        break;
      }
      case "raid": {
        this.emit("raid", {
          channel,
          user: {
            ...getUser(tags),
            login: tags.msgParamLogin
          },
          viewers: tags.msgParamViewerCount,
          tags
        });
        break;
      }
      case "unraid": {
        this.emit("unraid", {
          channel,
          tags
        });
        break;
      }
      case "bitsbadgetier": {
        this.emit("badgeUpgrade", {
          channel,
          user,
          type: "bits",
          threshold: tags.msgParamThreshold,
          tags,
          message: {
            id: tags.id,
            text,
            flags: tags.flags,
            emotes: tags.emotes,
            isAction,
            isFirst: "firstMsg" in tags && tags.firstMsg === !0
          }
        });
        break;
      }
      case "socialsharingbadge": {
        this.emit("badgeUpgrade", {
          channel,
          user,
          type: "socialSharing",
          threshold: tags.msgParamCurrentBadgeLevel,
          tags,
          message: {
            id: tags.id,
            text,
            flags: tags.flags,
            emotes: tags.emotes,
            isAction,
            isFirst: "firstMsg" in tags && tags.firstMsg === !0
          }
        });
        break;
      }
      case "viewermilestone": {
        this.emit("viewerMilestone", {
          channel,
          user,
          type: tags.msgParamCategory,
          milestone: {
            id: tags.msgParamId,
            value: tags.msgParamValue,
            reward: tags.msgParamCopoReward
          },
          tags
        });
        break;
      }
      case "sharedchatnotice": {
        let sharedChat = {
          channel: this.getChannelById(tags.sourceRoomId) ?? this.getChannelPlaceholder(tags.sourceRoomId, void 0),
          user: {
            badges: tags.sourceBadges,
            badgeInfo: tags.sourceBadgeInfo
          },
          message: {
            id: tags.sourceId
          },
          sourceOnly: tags.sourceOnly ?? !1
        };
        this.emit("sharedChatNotice", {
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
  handleNOTICE({ channel: channelName, tags, params }) {
    let { msgId } = tags;
    if (!msgId) {
      let message = params[1];
      switch (this.close(), message) {
        case "Login authentication failed":
          break;
        case "Improperly formatted auth":
          let error = new Error(`Catatrophic error: ${message}`);
          this.emit("error", error);
          break;
      }
      return;
    }
    let channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName);
    switch (msgId) {
      // Ignored messages
      case "emote_only_on":
      case "emote_only_off":
      case "followers_on_zero":
      case "followers_on":
      case "followers_off":
      case "r9k_on":
      case "r9k_off":
      case "slow_on":
      case "slow_off":
      case "subs_on":
      case "subs_off":
        break;
      // Messages that mean a sent message was dropped
      case "msg_channel_suspended":
      case "msg_banned_phone_number_alias":
      case "msg_duplicate":
      case "msg_timedout":
      case "unrecognized_cmd":
        this.emit("messageDropped", {
          channel,
          reason: msgId,
          systemMessage: params[0] ?? "",
          tags
        });
        break;
    }
  }
  handleCLEARCHAT({ channel: channelName, tags, params }) {
    let channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName), timestamp = tags.tmiSentTs;
    "banDuration" in tags ? this.emit("moderation", {
      type: "timeout",
      channel,
      duration: tags.banDuration,
      user: {
        id: tags.targetUserId,
        login: params[0]
      },
      timestamp,
      tags
    }) : "targetUserId" in tags ? this.emit("moderation", {
      type: "ban",
      channel,
      user: {
        id: tags.targetUserId,
        login: params[0]
      },
      timestamp,
      tags
    }) : this.emit("moderation", {
      type: "clearChat",
      channel,
      timestamp,
      tags
    });
  }
  handleCLEARMSG({ tags, channel: channelName, params }) {
    let channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName);
    this.emit("moderation", {
      type: "deleteMessage",
      channel,
      user: {
        login: tags.login
      },
      message: {
        id: tags.targetMsgId,
        text: params[0]
      },
      timestamp: tags.tmiSentTs,
      tags
    });
  }
  handleROOMSTATE({ tags, channel: channelName }) {
    let channel = this.getChannelById(tags.roomId);
    channel || (channel = new Channel(tags.roomId, channelName), this.channels.add(channel), this.channelsById.set(channel.id, channel), this.channelsByLogin.set(channel.login, channel), this.emit("join", { channel })), this.emit("roomState", {
      channel,
      emoteOnly: tags.emoteOnly,
      followersOnly: tags.followersOnly,
      unique: tags.unique,
      slow: tags.slow,
      subsOnly: tags.subsOnly,
      tags
    });
  }
  handlePART({ channel: channelName }) {
    let channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName);
    this.removeChannel(channel), this.emit("part", {
      channel
    });
  }
  handleWHISPER({ tags, prefix, params }) {
    let text = params[1], isAction = text.startsWith("/me ");
    isAction && (text = text.slice(4)), this.emit("whisper", {
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
  async handleRECONNECT(ircMessage) {
    if (!this.keepalive.cancelReconnect)
      try {
        await this.reconnect("RECONNECT command received");
      } catch (err) {
        this.emit("error", err);
      }
  }
  handle376(ircMessage) {
    this.identity.name = ircMessage.params[0], this.emit("connect"), this.joinPendingChannels();
  }
  isConnected() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  send(message) {
    if (!this.isConnected())
      throw new Error("Not connected");
    this.socket.send(message);
  }
  sendIrc(opts) {
    let result = format({
      ...opts,
      channel: opts.channel?.toString()
    });
    if (!result)
      throw new Error("Result message is empty");
    this.send(result);
  }
  async join(channelName) {
    let channel = typeof channelName == "string" ? Channel.toIrc(channelName) : channelName.toString(), responder = this.waitForCommand(
      this.didConnectAnonymously ? "JOIN" : "USERSTATE",
      (m) => m.prefix.nick ? m.prefix.nick === this.identity.name : !0,
      { channelHint: channel }
    );
    this.sendIrc({ command: "JOIN", channel }), await responder;
  }
  async part(channelName) {
    let channel = typeof channelName == "string" ? Channel.toIrc(channelName) : channelName.toString(), responder = this.waitForCommand(
      "PART",
      (m) => m.prefix.nick === this.identity.name,
      { channelHint: channel }
    );
    this.sendIrc({ command: "PART", channel }), await responder;
  }
  async say(channelName, message, tags = {}) {
    if (message.length === 0)
      throw new Error("Message cannot be empty");
    if (message.length > 500)
      throw new Error("Message is too long (max 500 characters)");
    let finalTags = {
      "client-nonce": this.generateClientNonce(),
      ...tags
    }, clientNonce = finalTags["client-nonce"], responder = this.waitForCommand(
      "USERSTATE",
      (m) => m.tags.clientNonce === clientNonce,
      { channelHint: Channel.toIrc(channelName) }
    );
    return this.sendIrc({
      command: "PRIVMSG",
      channel: channelName,
      params: [message],
      tags: finalTags
    }), await responder;
  }
  async reply(channelName, message, replyParentMsgId, tags = {}) {
    return this.say(channelName, message, {
      "reply-parent-msg-id": replyParentMsgId,
      ...tags
    });
  }
  generateClientNonce() {
    return `tmi.js-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
  }
  ping() {
    this.keepalive.lastPingSent = Date.now(), this.sendIrc({ command: "PING" }), this.keepalive.pingTimeout = setTimeout(() => {
      this.reconnect("Ping timeout exceeded");
    }, this.keepalive.pingTimeoutSeconds * 1e3);
  }
  async joinPendingChannels() {
    for (let channel of this.channelsPendingJoin)
      try {
        await Promise.all([
          this.join(channel),
          new Promise((res) => setTimeout(res, Math.max(1, this.pendingChannelJoinDelayMs)))
        ]);
      } catch (err) {
        let newError = new Error("Failed to join channel", { cause: err });
        this.emit("error", newError);
      }
  }
  waitForCommand(command, filterCallback, opts) {
    return new Promise((resolve, reject) => {
      let failOnDrop = opts?.failOnDrop ?? !0, timeoutMs = opts?.timeoutMs ?? Math.max(1e3, Math.min(this.keepalive.maxWaitTimeoutMs, (this.keepalive.latencyMs ?? 500) * 2)), channelHint = opts?.channelHint, commandListener = (ircMessage) => {
        ircMessage.command === command && (!channelHint || ircMessage.channel === channelHint) && (!filterCallback || filterCallback(ircMessage)) && (stop(), clearTimeout(timeout), resolve(ircMessage));
      }, dropListener = (event) => {
        channelHint && event.channel.toString() !== channelHint || (stop(), reject(new Error(`Message dropped: ${event.reason}`, { cause: event })));
      }, stop = () => {
        this.off("ircMessage", commandListener), failOnDrop && this.off("messageDropped", dropListener);
      }, timeout = setTimeout(() => {
        stop();
        let err = new Error(
          `Did not receive command in time (Command: ${command}, Waited: ${timeoutMs}ms)`,
          { cause: command }
        );
        reject(err);
      }, timeoutMs);
      timeout.unref?.(), this.on("ircMessage", commandListener), failOnDrop && this.on("messageDropped", dropListener);
    });
  }
};

// src/index.ts
var src_default = {
  Client,
  parseTag
};
export {
  Channel,
  ChannelPlaceholder,
  Client,
  src_default as default,
  parseTag
};
//# sourceMappingURL=tmi.node.mjs.map
