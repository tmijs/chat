"use strict";
var tmi = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Channel: () => Channel,
    ChannelPlaceholder: () => ChannelPlaceholder,
    Client: () => Client,
    default: () => src_default,
    parseTag: () => parseTag2
  });

  // node_modules/@tmi.js/irc-parser/dist/index.mjs
  var ircEscapedChars = {
    "s": " ",
    "n": "\n",
    "r": "\r",
    ":": ";",
    "\\": "\\"
  };
  var ircUnescapedChars = {
    " ": "s",
    "\n": "n",
    "\r": "r",
    ";": ":",
    "\\": "\\"
  };
  function unescapeIrc(value) {
    if (!value || !value.includes("\\")) {
      return value;
    }
    return value.replace(/\\[snr:\\]/g, (match) => ircEscapedChars[match[1]]);
  }
  function escapeIrc(value) {
    if (typeof value === "number") {
      value = value.toString();
    }
    return value.replace(/[\s\n\r;\\]/g, (match) => "\\" + ircUnescapedChars[match] || match);
  }
  function parse(line, parseTagCb) {
    if (!line) {
      return { raw: "", prefix: {}, command: "", channel: "", params: [], rawTags: {}, tags: {} };
    }
    let offset = 0;
    const getNextSpace = () => line.indexOf(" ", offset);
    const advanceToNextSpace = (start) => {
      if (start === void 0) {
        start = getNextSpace();
        if (start === -1) {
          offset = line.length;
          return;
        }
      } else if (start === -1) {
        offset = line.length;
        return;
      }
      offset = start + 1;
    };
    const charIs = (char, start = offset) => line[start] === char;
    const raw = line;
    let tagsRawString = "";
    if (charIs("@")) {
      const tagsEnd = getNextSpace();
      tagsRawString = line.slice(1, tagsEnd);
      advanceToNextSpace(tagsEnd);
    }
    let prefix = {};
    if (charIs(":")) {
      const prefixEnd = getNextSpace();
      const prefixRaw = line.slice(offset + 1, prefixEnd);
      prefix = parsePrefix(prefixRaw);
      advanceToNextSpace(prefixEnd);
    }
    const commandEnd = getNextSpace();
    const command = line.slice(offset, commandEnd === -1 ? void 0 : commandEnd);
    advanceToNextSpace(commandEnd);
    let channel = "";
    if (charIs("#")) {
      const channelEnd = getNextSpace();
      if (channelEnd === -1) {
        channel = line.slice(offset);
        advanceToNextSpace();
      } else {
        channel = line.slice(offset, channelEnd);
        advanceToNextSpace(channelEnd);
      }
    }
    const params = [];
    while (offset < line.length) {
      if (charIs(":")) {
        params.push(line.slice(offset + 1));
        break;
      }
      const nextSpace = getNextSpace();
      params.push(line.slice(offset, nextSpace));
      advanceToNextSpace(nextSpace);
    }
    const { rawTags, tags } = parseTagsFromString(tagsRawString, params, parseTagCb);
    const ircMessage = { raw, rawTags, tags, prefix, command, channel, params };
    return ircMessage;
  }
  function format(ircMessage) {
    const { tags, prefix: p, command, channel, params } = ircMessage;
    const prefixWith = (n, c = " ") => n ? `${c}${n}` : null;
    const tagsStr = tags ? prefixWith(formatTags(tags), "@") : null;
    const prefixStr = p ? prefixWith(formatPrefix(p), ":") : null;
    const channelStr = channel ? formatChannel(channel) : null;
    const paramsStr = params && params.length ? prefixWith(params.join(" "), ":") : null;
    return [tagsStr, prefixStr, command, channelStr, paramsStr].filter(Boolean).join(" ");
  }
  function parseTag(rawKey, rawValue, messageParams, cb) {
    const unescapedKey = unescapeIrc(rawKey);
    let key = unescapedKey;
    const unescapedValue = unescapeIrc(rawValue);
    let value = unescapedValue;
    if (cb) {
      [key, value] = cb(key, unescapedValue, messageParams ?? []);
    }
    return { unescapedKey, unescapedValue, key, value };
  }
  function parseTagsFromString(tagsRawString, messageParams, cb) {
    const rawTags = {};
    const tags = {};
    if (!tagsRawString) {
      return { rawTags, tags };
    }
    tagsRawString.split(";").forEach((str) => {
      const [rawKey, rawValue] = str.split("=");
      const { unescapedKey, unescapedValue, key, value } = parseTag(rawKey, rawValue, messageParams, cb);
      rawTags[unescapedKey] = unescapedValue;
      tags[key] = value;
    });
    return { rawTags, tags };
  }
  function parsePrefix(prefixRaw) {
    const prefix = {};
    if (!prefixRaw) {
      return prefix;
    }
    if (prefixRaw.includes("!")) {
      const [nick, userHost] = prefixRaw.split("!");
      prefix.nick = nick;
      [prefix.user, prefix.host] = userHost.includes("@") ? userHost.split("@") : [userHost, void 0];
    } else if (prefixRaw.includes("@")) {
      [prefix.user, prefix.host] = prefixRaw.split("@");
    } else {
      prefix.host = prefixRaw;
    }
    return prefix;
  }
  function formatTags(tags) {
    const entries = Array.isArray(tags) ? tags : Object.entries(tags);
    return entries.map(
      ([key, value]) => `${escapeIrc(key)}=${escapeIrc(value.toString())}`
    ).join(";");
  }
  function formatPrefix(prefix) {
    if (!prefix) {
      return "";
    }
    const { nick, user, host } = prefix;
    if (!nick) {
      return "";
    }
    return `${nick}${user ? `!${user}` : ""}${host ? `@${host}` : ""}`;
  }
  function formatChannel(channel) {
    return channel ? `${channel.startsWith("#") ? channel : `#${channel}`}` : "";
  }

  // src/lib/EventEmitter.ts
  var EventEmitter = class {
    listeners = /* @__PURE__ */ new Map();
    on(event, listener) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, /* @__PURE__ */ new Set());
      }
      this.listeners.get(event).add(listener);
      return this;
    }
    off(event, listener) {
      this.listeners.get(event)?.delete(listener);
      return this;
    }
    emit(event, ...args) {
      if (!this.listeners.has(event)) {
        if (event === "error") {
          if (args[0] instanceof Error) {
            throw args[0];
          } else {
            const uncaughtError = new Error("Uncaught error emitted", { cause: args[0] });
            throw uncaughtError;
          }
        }
        return false;
      }
      for (const listener of this.listeners.get(event)) {
        listener(...args);
      }
      return true;
    }
  };

  // src/lib/Identity.ts
  var Identity = class _Identity {
    name;
    id;
    token;
    static normalizeToken(value) {
      if (typeof value === "string" && value.toLowerCase().startsWith("oauth:")) {
        value = value.slice("oauth:".length);
      }
      return value;
    }
    isAnonymous() {
      return !this.token || typeof this.token === "string" && this.token.trim() === "";
    }
    setToken(value) {
      this.token = typeof value === "string" ? _Identity.normalizeToken(value) : value;
    }
    async getToken() {
      if (typeof this.token === "string") {
        return this.token;
      } else if (typeof this.token === "function") {
        const value = await this.token();
        return _Identity.normalizeToken(value);
      } else {
        throw new Error("Invalid token");
      }
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
      const name = this.name ? `"${this.name}"` : "undefined";
      const id = this.id ? `"${this.id}"` : this.id === "" ? '""' : "undefined";
      const token = this.token ? typeof this.token === "string" ? this.token === "" ? '""' : "[hidden]" : "[hidden function]" : "undefined";
      return `Identity { name: ${name}, id: ${id}, token: ${token} }`;
    }
  };

  // src/lib/Channel.ts
  var Channel = class _Channel {
    constructor(_id, _login) {
      this._id = _id;
      this._login = _login;
      this.id = _id;
      this.login = _login;
    }
    static toLogin(channelName) {
      const name = channelName.trim().toLowerCase();
      return name.startsWith("#") ? name.slice(1) : name;
    }
    static toIrc(channelName) {
      if (channelName instanceof _Channel) {
        return `#${channelName.login}`;
      }
      return `#${_Channel.toLogin(channelName)}`;
    }
    lastUserstate = null;
    set id(value) {
      if (typeof value !== "string") {
        throw new TypeError("Channel#id must be a string");
      }
      this._id = value;
    }
    get id() {
      return this._id;
    }
    set login(value) {
      if (typeof value !== "string") {
        throw new TypeError("Channel#login must be a string");
      }
      this._login = _Channel.toLogin(value);
    }
    get login() {
      return this._login;
    }
    toString() {
      return _Channel.toIrc(this._login);
    }
  };
  var ChannelPlaceholder = class extends Channel {
    constructor(id, login) {
      if (id === void 0 && login) {
        id = `unknownId:login(${Channel.toLogin(login)})`;
      } else if (login === void 0 && id) {
        login = `unknownLogin:id(${id})`;
      } else if (id === void 0 && login === void 0) {
        throw new Error("ChannelPlaceholder must have either id or login");
      }
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
  function parseTag2(key, value, params) {
    key = kebabToCamel(key);
    switch (key) {
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
      case "tmiSentTs": {
        return [key, parseInt(value, 10)];
      }
      // Literal boolean
      case "msgParamAnonGift":
      case "msgParamPriorGifterAnonymous":
      case "msgParamWasGifted": {
        return [key, value === "true"];
      }
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
      case "vip": {
        return [key, value === "1"];
      }
      case "r9k": {
        return ["unique", value === "1"];
      }
      // Followers only
      case "followersOnly": {
        return [key, { enabled: value !== "-1", durationMinutes: parseInt(value, 10) }];
      }
      // Badges
      case "badgeInfo":
      case "badges":
      case "sourceBadgeInfo":
      case "sourceBadges": {
        if (!value) {
          return [key, new Collection()];
        }
        return [key, value.split(",").reduce((p, badge) => {
          const [badgeKey, version] = badge.split("/");
          p.set(badgeKey, version);
          return p;
        }, new Collection())];
      }
      // Emotes
      case "emotes": {
        if (!value) {
          return [key, []];
        }
        return [key, value.split("/").map((emote) => {
          const [id, raw] = emote.split(":");
          const indices = raw.split(",").map((pos) => {
            const [start, end] = pos.split("-");
            return [Number(start), Number(end) + 1];
          });
          return { id, indices };
        })];
      }
      // Comma-separated lists
      case "emoteSets": {
        return [key, value.split(",")];
      }
      // Thread ID
      case "threadId": {
        return [key, value.split("_")];
      }
      // Flags
      case "flags": {
        const flags = [];
        if (!value) {
          return [key, flags];
        }
        const messageSplit = [...params[0]];
        for (const flag of value.split(",")) {
          const [indices, flagType] = flag.split(":");
          const [start, end] = indices.split("-");
          const index = [Number(start), Number(end) + 1];
          const flagTypeSplit = flagType.split("/");
          flags.push({
            index,
            flags: flagTypeSplit.reduce((p, [type, , level]) => {
              p[type] = Number(level);
              return p;
            }, {}),
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
      case "userType": {
        return [key, value];
      }
      case "msgParamProfileImageURL": {
        return ["msgParamProfileImageUrl", value];
      }
    }
    return [key, value];
  }

  // src/Client.ts
  var ACTION_MESSAGE_PREFIX = "ACTION ";
  var ACTION_MESSAGE_SUFFIX = "";
  var ANONYMOUS_GIFTER_LOGIN = "ananonymousgifter";
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
      isVip: "vip" in tags && tags.vip === true,
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
    wasCloseCalled = false;
    constructor(opts) {
      super();
      this.channelsPendingJoin = (opts?.channels ?? []).reduce((p, n) => {
        p.add(Channel.toLogin(n));
        return p;
      }, /* @__PURE__ */ new Set());
      if (opts?.token) {
        this.identity.setToken(opts.token);
      }
      if (opts?.joinDelayMs !== void 0) {
        this.pendingChannelJoinDelayMs = opts.joinDelayMs;
      }
    }
    connect() {
      if (this.isConnected()) {
        throw new Error("Client is already connected");
      }
      this.wasCloseCalled = false;
      this.didConnectAnonymously = void 0;
      const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
      this.socket = socket;
      socket.onmessage = (e) => this.onSocketMessage(e);
      socket.onclose = (e) => this.onSocketClose(e);
      socket.onopen = (e) => this.onSocketOpen(e);
      socket.onerror = (e) => this.onSocketError(e);
    }
    close() {
      this.wasCloseCalled = true;
      if (this.isConnected()) {
        this.socket.close();
      }
    }
    async reconnect(reason = "reconnect called") {
      if (this.keepalive.reconnectTimeout) {
        throw new Error("Cannot reconnect while already reconnecting");
      }
      this.close();
      const reconnectWaitTime = Math.min(1e3 * 1.23 ** this.keepalive.reconnectAttempts++, 6e4);
      this.emit("reconnecting", {
        attempts: this.keepalive.reconnectAttempts,
        waitTime: reconnectWaitTime,
        reason
      });
      let hasSettled = false;
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      this.keepalive.cancelReconnect = () => {
        if (this.keepalive.reconnectTimeout) {
          clearTimeout(this.keepalive.reconnectTimeout);
          this.keepalive.reconnectTimeout = void 0;
        }
        if (!hasSettled) {
          hasSettled = true;
          reject(new Error("Reconnect cancelled"));
        }
      };
      this.keepalive.reconnectTimeout = setTimeout(() => {
        this.keepalive.cancelReconnect = void 0;
        this.keepalive.reconnectTimeout = void 0;
        if (!hasSettled) {
          hasSettled = true;
          this.connect();
          resolve();
        }
      }, reconnectWaitTime);
      try {
        await promise;
      } catch (err) {
        if (this.keepalive.reconnectTimeout) {
          clearTimeout(this.keepalive.reconnectTimeout);
        }
        this.keepalive.cancelReconnect = void 0;
        this.keepalive.reconnectTimeout = void 0;
        throw err;
      }
    }
    onSocketMessage(event) {
      event.data.trim().split("\r\n").forEach((line) => this.onIrcLine(line));
    }
    onSocketClose(event) {
      clearInterval(this.keepalive.pingInterval);
      clearTimeout(this.keepalive.pingTimeout);
      this.clearChannels();
      if (!this.wasCloseCalled && !this.keepalive.cancelReconnect) {
        this.reconnect("Socket was closed unexpectedly").catch((err) => {
          this.emit("error", err);
        });
      }
      this.emit("close", {
        reason: event.reason,
        code: event.code,
        wasCloseCalled: this.wasCloseCalled
      });
    }
    async onSocketOpen(event) {
      this.keepalive.reconnectAttempts = 0;
      let token = "schmoopiie";
      let isAnon = this.identity.isAnonymous();
      if (!isAnon) {
        const tokenValue = await this.identity.getToken();
        if (tokenValue) {
          token = `oauth:${tokenValue}`;
        } else {
          isAnon = true;
        }
      }
      this.didConnectAnonymously = isAnon;
      this.sendIrc({ command: "CAP REQ", params: ["twitch.tv/commands", "twitch.tv/tags"] });
      this.sendIrc({ command: "PASS", params: [token] });
      this.sendIrc({ command: "NICK", params: [isAnon ? "justinfan123456" : "justinfan"] });
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
      const successA = this.channels.delete(channel);
      const successB = this.channelsById.delete(channel.id);
      const successC = this.channelsByLogin.delete(channel.login);
      return successA && successB && successC;
    }
    clearChannels() {
      this.channels.clear();
      this.channelsById.clear();
      this.channelsByLogin.clear();
    }
    getChannelPlaceholder(id, login) {
      const channel = new ChannelPlaceholder(id, login);
      return channel;
    }
    onIrcLine(line) {
      const ircMessage = parse(line, parseTag2);
      if (!ircMessage) {
        return;
      }
      this.onIrcMessage(ircMessage);
    }
    onIrcMessage(ircMessage) {
      this.emit("ircMessage", ircMessage);
      switch (ircMessage.command) {
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
        case "372": {
          break;
        }
        default: {
          break;
        }
      }
    }
    handlePING(ircMessage) {
      this.keepalive.lastPingReceivedAt = Date.now();
      this.sendIrc({ command: "PONG", params: ircMessage.params });
    }
    handlePONG(ircMessage) {
      clearTimeout(this.keepalive.pingTimeout);
      this.keepalive.lastPongReceivedAt = Date.now();
      if (this.keepalive.lastPingSent === void 0) {
        throw new Error("Received PONG without having sent a PING");
      }
      this.keepalive.latencyMs = this.keepalive.lastPongReceivedAt - this.keepalive.lastPingSent;
      this.emit("pong");
    }
    handlePRIVMSG({ tags, prefix, channel: channelString, params }) {
      const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString);
      let text = params[0];
      const isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
      if (isAction) {
        text = text.slice(8, -1);
      }
      let sharedChat;
      let cheer;
      let parent;
      let reward;
      if ("sourceRoomId" in tags) {
        const sharedChannel = this.getChannelById(tags.sourceRoomId) ?? this.getChannelPlaceholder(tags.sourceRoomId, void 0);
        sharedChat = {
          channel: sharedChannel,
          user: {
            badges: tags.sourceBadges,
            badgeInfo: tags.sourceBadgeInfo
          },
          message: {
            id: tags.sourceId
          },
          sourceOnly: tags.sourceOnly
        };
      }
      if ("bits" in tags) {
        cheer = {
          bits: tags.bits
        };
      }
      if ("replyParentMsgId" in tags) {
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
      if ("customRewardId" in tags && tags.customRewardId) {
        reward = {
          type: "custom",
          rewardId: tags.customRewardId
        };
      } else if ("msgId" in tags && tags.msgId) {
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
            let finalEmote;
            const getEmote = () => {
              if (finalEmote) {
                return finalEmote;
              }
              if (!tags.emotes.length) {
                throw new Error("No emotes found in gigantified emote message");
              }
              let _finalEmote = tags.emotes[0];
              let finalIndex = _finalEmote.indices.at(-1)[1];
              for (let i = 1; i < tags.emotes.length; i++) {
                const emote = tags.emotes[i];
                const emoteIndex = emote.indices.at(-1)[1];
                if (emoteIndex > finalIndex) {
                  finalEmote = emote;
                  finalIndex = emoteIndex;
                }
              }
              finalEmote = _finalEmote;
              return finalEmote;
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
      const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName);
      const user = {
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
      };
      this.emit("userState", {
        channel,
        user
      });
    }
    handleGLOBALUSERSTATE({ tags }) {
      this.identity.id = tags.userId;
      this.emit("globalUserState", {
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
      const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelString);
      let text = params[0] ?? "";
      const isAction = text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
      if (isAction) {
        text = text.slice(8, -1);
      }
      const user = {
        ...getUser(tags),
        login: tags.login,
        isTurbo: "turbo" in tags && tags.turbo === true,
        isReturningChatter: "returningChatter" in tags && tags.returningChatter === true
      };
      let goal;
      if ("msgParamGoalContributionType" in tags && tags.msgParamGoalContributionType) {
        goal = {
          type: tags.msgParamGoalContributionType,
          description: tags.msgParamGoalDescription ?? "",
          current: tags.msgParamGoalCurrentContributions,
          target: tags.msgParamGoalTargetContributions,
          userContributions: tags.msgParamGoalUserContributions
        };
      }
      const PRIME = "Prime";
      const getTier = (plan) => {
        if (typeof plan !== "string" || plan === PRIME) {
          return 1;
        }
        return parseInt(plan.slice(0, 1));
      };
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
              isFirst: "firstMsg" in tags && tags.firstMsg === true
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
          let streak;
          let gift;
          if (tags.msgParamShouldShareStreak) {
            streak = {
              months: tags.msgParamStreakMonths
            };
          }
          if (tags.msgParamWasGifted) {
            gift = {
              monthBeingRedeemed: tags.msgParamGiftMonthBeingRedeemed,
              months: tags.msgParamGiftMonths,
              gifter: {
                isAnon: tags.msgParamAnonGift,
                id: tags.msgParamGifterId,
                login: tags.msgParamGifterLogin,
                display: tags.msgParamGifterName
              }
            };
          }
          this.emit("sub", {
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
          if (tags.msgParamCommunityGiftId) {
            mystery = {
              id: tags.msgParamCommunityGiftId
            };
          }
          this.emit("sub", {
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
          if ("msgParamGiftMatch" in tags) {
            giftMatch = {
              type: tags.msgParamGiftMatch,
              bonusCount: tags.msgParamGiftMatchBonusCount,
              extraCount: tags.msgParamGiftMatchExtraCount,
              originalGifter: tags.msgParamGiftMatchGifterDisplayName
            };
          }
          this.emit("sub", {
            type: "subMysteryGift",
            channel,
            user,
            plan: {
              name: void 0,
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
              isPrime: false
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
          const topContributors = [];
          const addContributor = (display, taps) => {
            if (display && taps) {
              topContributors.push({ display, taps });
            }
          };
          addContributor(tags.msgParamContributor1, tags.msgParamContributor1Taps);
          addContributor(tags.msgParamContributor2, tags.msgParamContributor2Taps);
          addContributor(tags.msgParamContributor3, tags.msgParamContributor3Taps);
          this.emit("combos", {
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
              isFirst: "firstMsg" in tags && tags.firstMsg === true
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
              isFirst: "firstMsg" in tags && tags.firstMsg === true
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
          const sharedChannel = this.getChannelById(tags.sourceRoomId) ?? this.getChannelPlaceholder(tags.sourceRoomId, void 0);
          const sharedChat = {
            channel: sharedChannel,
            user: {
              badges: tags.sourceBadges,
              badgeInfo: tags.sourceBadgeInfo
            },
            message: {
              id: tags.sourceId
            },
            sourceOnly: tags.sourceOnly ?? false
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
      const { msgId } = tags;
      if (!msgId) {
        const message = params[1];
        this.close();
        switch (message) {
          case "Login authentication failed":
            break;
          case "Improperly formatted auth":
            const error = new Error(`Catatrophic error: ${message}`);
            this.emit("error", error);
            break;
        }
        return;
      }
      const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName);
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
      const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName);
      const timestamp = tags.tmiSentTs;
      if ("banDuration" in tags) {
        this.emit("moderation", {
          type: "timeout",
          channel,
          duration: tags.banDuration,
          user: {
            id: tags.targetUserId,
            login: params[0]
          },
          timestamp,
          tags
        });
      } else if ("targetUserId" in tags) {
        this.emit("moderation", {
          type: "ban",
          channel,
          user: {
            id: tags.targetUserId,
            login: params[0]
          },
          timestamp,
          tags
        });
      } else {
        this.emit("moderation", {
          type: "clearChat",
          channel,
          timestamp,
          tags
        });
      }
    }
    handleCLEARMSG({ tags, channel: channelName, params }) {
      const channel = this.getChannelById(tags.roomId) ?? this.getChannelPlaceholder(tags.roomId, channelName);
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
      if (!channel) {
        channel = new Channel(tags.roomId, channelName);
        this.channels.add(channel);
        this.channelsById.set(channel.id, channel);
        this.channelsByLogin.set(channel.login, channel);
        this.emit("join", { channel });
      }
      this.emit("roomState", {
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
      const channel = this.getChannelByLogin(channelName) ?? this.getChannelPlaceholder(void 0, channelName);
      this.removeChannel(channel);
      this.emit("part", {
        channel
      });
    }
    handleWHISPER({ tags, prefix, params }) {
      let text = params[1];
      const isAction = text.startsWith("/me ");
      if (isAction) {
        text = text.slice(4);
      }
      this.emit("whisper", {
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
      if (!this.keepalive.cancelReconnect) {
        try {
          await this.reconnect("RECONNECT command received");
        } catch (err) {
          this.emit("error", err);
        }
      }
    }
    handle376(ircMessage) {
      this.identity.name = ircMessage.params[0];
      this.emit("connect");
      this.joinPendingChannels();
    }
    isConnected() {
      return !!this.socket && this.socket.readyState === WebSocket.OPEN;
    }
    send(message) {
      if (!this.isConnected()) {
        throw new Error("Not connected");
      }
      this.socket.send(message);
    }
    sendIrc(opts) {
      const result = format({
        ...opts,
        channel: opts.channel?.toString()
      });
      if (!result) {
        throw new Error("Result message is empty");
      }
      this.send(result);
    }
    async join(channelName) {
      const channel = typeof channelName === "string" ? Channel.toIrc(channelName) : channelName.toString();
      const responder = this.waitForCommand(
        this.didConnectAnonymously ? "JOIN" : "USERSTATE",
        (m) => m.prefix.nick ? m.prefix.nick === this.identity.name : true,
        { channelHint: channel }
      );
      this.sendIrc({ command: "JOIN", channel });
      await responder;
    }
    async part(channelName) {
      const channel = typeof channelName === "string" ? Channel.toIrc(channelName) : channelName.toString();
      const responder = this.waitForCommand(
        "PART",
        (m) => m.prefix.nick === this.identity.name,
        { channelHint: channel }
      );
      this.sendIrc({ command: "PART", channel });
      await responder;
    }
    async say(channelName, message, tags = {}) {
      if (message.length === 0) {
        throw new Error("Message cannot be empty");
      } else if (message.length > 500) {
        throw new Error("Message is too long (max 500 characters)");
      }
      const finalTags = {
        "client-nonce": this.generateClientNonce(),
        ...tags
      };
      const clientNonce = finalTags["client-nonce"];
      const responder = this.waitForCommand(
        "USERSTATE",
        (m) => m.tags.clientNonce === clientNonce,
        { channelHint: Channel.toIrc(channelName) }
      );
      this.sendIrc({
        command: "PRIVMSG",
        channel: channelName,
        params: [message],
        tags: finalTags
      });
      return await responder;
    }
    async reply(channelName, message, replyParentMsgId, tags = {}) {
      return this.say(channelName, message, {
        "reply-parent-msg-id": replyParentMsgId,
        ...tags
      });
    }
    generateClientNonce() {
      const nonce = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
      return `tmi.js-${nonce}`;
    }
    ping() {
      this.keepalive.lastPingSent = Date.now();
      this.sendIrc({ command: "PING" });
      this.keepalive.pingTimeout = setTimeout(() => {
        this.reconnect("Ping timeout exceeded");
      }, this.keepalive.pingTimeoutSeconds * 1e3);
    }
    async joinPendingChannels() {
      for (const channel of this.channelsPendingJoin) {
        try {
          await Promise.all([
            this.join(channel),
            new Promise((res) => setTimeout(res, Math.max(1, this.pendingChannelJoinDelayMs)))
          ]);
        } catch (err) {
          const newError = new Error("Failed to join channel", { cause: err });
          this.emit("error", newError);
        }
      }
    }
    waitForCommand(command, filterCallback, opts) {
      return new Promise((resolve, reject) => {
        const failOnDrop = opts?.failOnDrop ?? true;
        const timeoutMs = opts?.timeoutMs ?? Math.max(1e3, Math.min(this.keepalive.maxWaitTimeoutMs, (this.keepalive.latencyMs ?? 500) * 2));
        const channelHint = opts?.channelHint;
        const commandListener = (ircMessage) => {
          if (ircMessage.command === command && (!channelHint || ircMessage.channel === channelHint) && (!filterCallback || filterCallback(ircMessage))) {
            stop();
            clearTimeout(timeout);
            resolve(ircMessage);
          }
        };
        const dropListener = (event) => {
          if (channelHint && event.channel.toString() !== channelHint) {
            return;
          }
          stop();
          reject(new Error(`Message dropped: ${event.reason}`, { cause: event }));
        };
        const stop = () => {
          this.off("ircMessage", commandListener);
          if (failOnDrop) {
            this.off("messageDropped", dropListener);
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
        this.on("ircMessage", commandListener);
        if (failOnDrop) {
          this.on("messageDropped", dropListener);
        }
      });
    }
  };

  // src/index.ts
  var src_default = {
    Client,
    parseTag: parseTag2
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=tmi.browser-global.js.map
