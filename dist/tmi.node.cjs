"use strict";
var M = Object.defineProperty;
var v = Object.getOwnPropertyDescriptor;
var k = Object.getOwnPropertyNames;
var U = Object.prototype.hasOwnProperty;
var B = (t, e) => {
  for (var r in e)
    M(t, r, { get: e[r], enumerable: !0 });
}, O = (t, e, r, a) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let s of k(e))
      !U.call(t, s) && s !== r && M(t, s, { get: () => e[s], enumerable: !(a = v(e, s)) || a.enumerable });
  return t;
};
var A = (t) => O(M({}, "__esModule", { value: !0 }), t);

// src/index.ts
var Q = {};
B(Q, {
  Client: () => P,
  default: () => Y,
  parseTag: () => T
});
module.exports = A(Q);

// node_modules/@tmi.js/irc-parser/dist/index.mjs
var L = {
  s: " ",
  n: `
`,
  r: "\r",
  ":": ";",
  "\\": "\\"
}, D = {
  " ": "s",
  "\n": "n",
  "\r": "r",
  ";": ":",
  "\\": "\\"
};
function G(t) {
  return !t || !t.includes("\\") ? t : t.replace(/\\[snr:\\]/g, (e) => L[e[1]]);
}
function R(t) {
  return typeof t == "number" && (t = t.toString()), t.replace(/[\s\n\r;\\]/g, (e) => "\\" + D[e] || e);
}
function w(t, e) {
  if (!t)
    return { raw: "", prefix: {}, command: "", channel: "", params: [], rawTags: {}, tags: {} };
  let r = 0, a = () => t.indexOf(" ", r), s = (c) => {
    if (c === void 0) {
      if (c = a(), c === -1) {
        r = t.length;
        return;
      }
    } else if (c === -1) {
      r = t.length;
      return;
    }
    r = c + 1;
  }, n = (c, x = r) => t[x] === c, i = t, m = "";
  if (n("@")) {
    let c = a();
    m = t.slice(1, c), s(c);
  }
  let l = {};
  if (n(":")) {
    let c = a(), x = t.slice(r + 1, c);
    l = W(x), s(c);
  }
  let d = a(), o = t.slice(r, d === -1 ? void 0 : d);
  s(d);
  let g = "";
  if (n("#")) {
    let c = a();
    c === -1 ? (g = t.slice(r), s()) : (g = t.slice(r, c), s(c));
  }
  let p = [];
  for (; r < t.length; ) {
    if (n(":")) {
      p.push(t.slice(r + 1));
      break;
    }
    let c = a();
    p.push(t.slice(r, c)), s(c);
  }
  let { rawTags: h, tags: y } = F(m, p, e);
  return { raw: i, rawTags: h, tags: y, prefix: l, command: o, channel: g, params: p };
}
function N(t) {
  let { tags: e, prefix: r, command: a, channel: s, params: n } = t, i = (g, p = " ") => g ? `${p}${g}` : null, m = e ? i(V(e), "@") : null, l = r ? i(H(r), ":") : null, d = s ? $(s) : null, o = n && n.length ? i(n.join(" "), ":") : null;
  return [m, l, a, d, o].filter(Boolean).join(" ");
}
function _(t, e, r, a) {
  let s = G(t), n = s, i = G(e), m = i;
  return a && ([n, m] = a(n, i, r ?? [])), { unescapedKey: s, unescapedValue: i, key: n, value: m };
}
function F(t, e, r) {
  let a = {}, s = {};
  return t ? (t.split(";").forEach((n) => {
    let [i, m] = n.split("="), { unescapedKey: l, unescapedValue: d, key: o, value: g } = _(i, m, e, r);
    a[l] = d, s[o] = g;
  }), { rawTags: a, tags: s }) : { rawTags: a, tags: s };
}
function W(t) {
  let e = {};
  if (!t)
    return e;
  if (t.includes("!")) {
    let [r, a] = t.split("!");
    e.nick = r, [e.user, e.host] = a.includes("@") ? a.split("@") : [a, void 0];
  } else t.includes("@") ? [e.user, e.host] = t.split("@") : e.host = t;
  return e;
}
function V(t) {
  return (Array.isArray(t) ? t : Object.entries(t)).map(
    ([r, a]) => `${R(r)}=${R(a.toString())}`
  ).join(";");
}
function H(t) {
  if (!t)
    return "";
  let { nick: e, user: r, host: a } = t;
  return e ? `${e}${r ? `!${r}` : ""}${a ? `@${a}` : ""}` : "";
}
function $(t) {
  return t ? `${t.startsWith("#") ? t : `#${t}`}` : "";
}

// src/lib/EventEmitter.ts
var f = class {
  listeners = /* @__PURE__ */ new Map();
  on(e, r) {
    return this.listeners.has(e) || this.listeners.set(e, /* @__PURE__ */ new Set()), this.listeners.get(e).add(r), this;
  }
  off(e, r) {
    return this.listeners.get(e)?.delete(r), this;
  }
  emit(e, ...r) {
    if (!this.listeners.has(e)) {
      if (e === "error")
        throw r[0] instanceof Error ? r[0] : new Error("Uncaught error emitted", { cause: r[0] });
      return !1;
    }
    for (let a of this.listeners.get(e))
      a(...r);
    return !0;
  }
};

// src/lib/Collection.ts
var I = class extends Map {
  toJSON() {
    return [...this.entries()];
  }
};

// src/irc.ts
var K = /-(\w)/g;
function j(t) {
  return t.replace(K, (e, r) => r.toUpperCase());
}
function T(t, e, r) {
  switch (t = j(t), t) {
    // Integer
    case "banDuration":
    case "bits":
    case "msgParamCopoReward":
    case "msgParamCumulativeMonths":
    case "msgParamGiftMatchBonusCount":
    case "msgParamGiftMatchExtraCount":
    case "msgParamGiftMonthBeingRedeemed":
    case "msgParamGiftMonths":
    case "msgParamGoalCurrentContributions":
    case "msgParamGoalTargetContributions":
    case "msgParamGoalUserContributions":
    case "msgParamMassGiftCount":
    case "msgParamMonths":
    case "msgParamMultimonthDuration":
    case "msgParamMultimonthTenure":
    case "msgParamSenderCount":
    case "msgParamStreakMonths":
    case "msgParamThreshold":
    case "msgParamValue":
    case "msgParamViewerCount":
    case "sentTs":
    case "slow":
    case "tmiSentTs":
      return [t, parseInt(e, 10)];
    // Literal boolean
    case "msgParamAnonGift":
    case "msgParamPriorGifterAnonymous":
    case "msgParamWasGifted":
      return [t, e === "true"];
    // Boolean number
    case "emoteOnly":
    // Occurs in ROOMSTATE and PRIVMSG
    case "firstMsg":
    case "mod":
    case "msgParamShouldShareStreak":
    case "returningChatter":
    case "subsOnly":
    case "subscriber":
    case "turbo":
    case "vip":
      return [t, e === "1"];
    case "r9k":
      return ["unique", e === "1"];
    // Followers only
    case "followersOnly":
      return [t, { enabled: e !== "-1", durationMinutes: parseInt(e, 10) }];
    // Badges
    case "badgeInfo":
    case "badges":
    case "sourceBadgeInfo":
    case "sourceBadges":
      return e ? [t, e.split(",").reduce((a, s) => {
        let [n, i] = s.split("/");
        return a.set(n, i), a;
      }, new I())] : [t, new I()];
    // Emotes
    case "emotes":
      return e ? [t, e.split("/").map((a) => {
        let [s, n] = a.split(":"), i = n.split(",").map((m) => {
          let [l, d] = m.split("-");
          return [Number(l), Number(d) + 1];
        });
        return { id: s, indices: i };
      })] : [t, []];
    // Comma-separated lists
    case "emoteSets":
      return [t, e.split(",")];
    // Thread ID
    case "threadId":
      return [t, e.split("_")];
    // Flags
    case "flags": {
      let a = [];
      if (!e)
        return [t, a];
      let s = [...r[0]];
      for (let n of e.split(",")) {
        let [i, m] = n.split(":"), [l, d] = i.split("-"), o = [Number(l), Number(d) + 1], g = m.split("/");
        a.push({
          index: o,
          flags: g.reduce((p, [h, , y]) => (p[h] = Number(y), p), {}),
          text: s.slice(...o).join("")
        });
      }
      return [t, a];
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
    case "msgParamColor":
    case "msgParamCommunityGiftId":
    case "msgParamDisplayName":
    case "msgParamFunString":
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
      return [t, e];
    case "msgParamProfileImageURL":
      return ["msgParamProfileImageUrl", e];
  }
  return [t, e];
}

// src/lib/Identity.ts
var b = class {
  name;
  id;
  token;
  isAnonymous() {
    return !this.token || typeof this.token == "string" && this.token.trim() === "";
  }
  setToken(e) {
    this.token = e;
  }
  async getToken() {
    if (typeof this.token == "string")
      return this.token;
    if (typeof this.token == "function")
      return await this.token();
    throw new Error("Invalid token");
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    let e = this.name ? `"${this.name}"` : "undefined", r = this.id ? `"${this.id}"` : this.id === "" ? '""' : "undefined", a = this.token ? typeof this.token == "string" ? this.token === "" ? '""' : "[hidden]" : "[hidden function]" : "undefined";
    return `Identity { name: ${e}, id: ${r}, token: ${a} }`;
  }
};

// src/lib/Channel.ts
var u = class t {
  constructor(e, r) {
    this._id = e;
    this._login = r;
    this.id = e, this.login = r;
  }
  static toLogin(e) {
    let r = e.trim().toLowerCase();
    return r.startsWith("#") ? r.slice(1) : r;
  }
  static toIrc(e) {
    return e instanceof t ? `#${e.login}` : `#${t.toLogin(e)}`;
  }
  lastUserstate = null;
  set id(e) {
    if (typeof e != "string")
      throw new TypeError("Channel#id must be a string");
    this._id = e;
  }
  get id() {
    return this._id;
  }
  set login(e) {
    if (typeof e != "string")
      throw new TypeError("Channel#login must be a string");
    this._login = t.toLogin(e);
  }
  get login() {
    return this._login;
  }
  toString() {
    return t.toIrc(this._login);
  }
}, S = class extends u {
  constructor(e, r) {
    if (e === void 0 && r)
      e = `unknownId:login(${u.toLogin(r)})`;
    else if (r === void 0 && e)
      r = `unknownLogin:id(${e})`;
    else if (e === void 0 && r === void 0)
      throw new Error("ChannelPlaceholder must have either id or login");
    super(e, r);
  }
};

// src/Client.ts
var q = "ACTION ", z = "", X = "ananonymousgifter";
function E(t) {
  return {
    id: t.userId,
    // login: tags.login ?? prefix.nick,
    display: t.displayName,
    color: t.color,
    badges: t.badges,
    badgeInfo: t.badgeInfo,
    isBroadcaster: t.badges.has("broadcaster"),
    isMod: t.mod,
    isSubscriber: t.subscriber,
    isFounder: t.badges.has("founder"),
    isVip: "vip" in t && t.vip === !0,
    type: t.userType
    // isTurbo: 'turbo' in tags && tags.turbo === true,
    // isReturningChatter: 'returningChatter' in tags && tags.returningChatter === true
  };
}
var P = class extends f {
  socket = void 0;
  keepalive = {
    maxWaitTimeoutMs: 15e3,
    pingIntervalSeconds: 15,
    pingTimeoutSeconds: 10,
    reconnectAttempts: 0
  };
  channelsPendingJoin;
  channels = /* @__PURE__ */ new Set();
  channelsById = /* @__PURE__ */ new Map();
  channelsByLogin = /* @__PURE__ */ new Map();
  identity = new b();
  wasCloseCalled = !1;
  constructor(e) {
    super(), this.channelsPendingJoin = (e?.channels ?? []).reduce((r, a) => (r.add(u.toLogin(a)), r), /* @__PURE__ */ new Set()), e?.token && this.identity.setToken(e.token);
  }
  connect() {
    if (this.isConnected())
      throw new Error("Client is already connected");
    this.wasCloseCalled = !1;
    let e = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    this.socket = e, e.onmessage = (r) => this.onSocketMessage(r), e.onclose = (r) => this.onSocketClose(r), e.onopen = (r) => this.onSocketOpen(r), e.onerror = (r) => this.onSocketError(r);
  }
  close() {
    this.wasCloseCalled = !0, this.isConnected() && this.socket?.close();
  }
  async reconnect() {
    this.close();
    let e = Math.min(1e3 * 1.23 ** this.keepalive.reconnectAttempts++, 6e4);
    this.emit("reconnecting", {
      attempts: this.keepalive.reconnectAttempts,
      waitTime: e
    }), await new Promise((r) => setTimeout(r, e)), this.connect();
  }
  onSocketMessage(e) {
    e.data.trim().split(`\r
`).forEach((r) => this.onIrcLine(r));
  }
  onSocketClose(e) {
    this.emit("close", {
      reason: e.reason,
      code: e.code,
      wasCloseCalled: this.wasCloseCalled
    });
  }
  async onSocketOpen(e) {
    this.keepalive.reconnectAttempts = 0;
    let r = this.identity.isAnonymous(), a = r ? "schmoopiie" : `oauth:${await this.identity.getToken()}`;
    this.sendIrc({ command: "CAP REQ", params: ["twitch.tv/commands", "twitch.tv/tags"] }), this.sendIrc({ command: "PASS", params: [a] }), this.sendIrc({ command: "NICK", params: [r ? "justinfan123456" : "justinfan"] });
  }
  onSocketError(e) {
    this.emit("socketError", e);
  }
  getChannelById(e) {
    return this.channelsById.get(e);
  }
  getChannelByLogin(e) {
    return this.channelsByLogin.get(u.toLogin(e));
  }
  getChannelPlaceholder(e, r) {
    return new S(e, r);
  }
  onIrcLine(e) {
    let r = w(e, T);
    r && this.onIrcMessage(r);
  }
  onIrcMessage(e) {
    switch (this.emit("ircMessage", e), e.command) {
      case "PING":
        return this.handlePING(e);
      case "PONG":
        return this.handlePONG(e);
      case "PRIVMSG":
        return this.handlePRIVMSG(e);
      case "USERSTATE":
        return this.handleUSERSTATE(e);
      case "GLOBALUSERSTATE":
        return this.handleGLOBALUSERSTATE(e);
      case "USERNOTICE":
        return this.handleUSERNOTICE(e);
      case "NOTICE":
        return this.handleNOTICE(e);
      case "CLEARCHAT":
        return this.handleCLEARCHAT(e);
      case "CLEARMSG":
        return this.handleCLEARMSG(e);
      case "ROOMSTATE":
        return this.handleROOMSTATE(e);
      case "JOIN":
        return this.handleJOIN(e);
      case "PART":
        return this.handlePART(e);
      case "WHISPER":
        return this.handleWHISPER(e);
      case "RECONNECT":
        return this.handleRECONNECT(e);
      case "376":
        return this.handle376(e);
      // Ignore these messages
      case "CAP":
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
  handlePING(e) {
    this.keepalive.lastPingReceivedAt = Date.now(), this.sendIrc({ command: "PONG", params: e.params });
  }
  handlePONG(e) {
    if (clearTimeout(this.keepalive.pingTimeout), this.keepalive.lastPongReceivedAt = Date.now(), this.keepalive.lastPingSent === void 0)
      throw new Error("Received PONG without having sent a PING");
    this.keepalive.latencyMs = this.keepalive.lastPongReceivedAt - this.keepalive.lastPingSent, this.emit("pong");
  }
  handlePRIVMSG({ tags: e, prefix: r, channel: a, params: s }) {
    let n = this.getChannelById(e.roomId) ?? this.getChannelPlaceholder(e.roomId, a), i = s[0], m = i.startsWith(q) && i.endsWith(z);
    m && (i = i.slice(8, -1));
    let l, d, o, g;
    if ("sourceRoomId" in e && (l = {
      channel: this.getChannelById(e.sourceRoomId) ?? this.getChannelPlaceholder(e.sourceRoomId, void 0),
      user: {
        badges: e.sourceBadges,
        badgeInfo: e.sourceBadgeInfo
      },
      message: {
        id: e.sourceId
      }
    }), "bits" in e && (d = {
      bits: e.bits
    }), "replyParentMsgId" in e && (o = {
      id: e.replyParentMsgId,
      text: e.replyParentMsgBody,
      user: {
        id: e.replyParentUserId,
        login: e.replyParentUserLogin,
        display: e.replyParentDisplayName
      },
      thread: {
        id: e.replyThreadParentMsgId,
        user: {
          id: e.replyThreadParentUserId,
          login: e.replyThreadParentUserLogin,
          display: e.replyThreadParentDisplayName
        }
      }
    }), "customRewardId" in e)
      g = {
        type: "custom",
        rewardId: e.customRewardId
      };
    else if ("msgId" in e)
      switch (e.msgId) {
        case "highlighted-message": {
          g = { type: "highlighted" };
          break;
        }
        case "skip-subs-mode-message": {
          g = { type: "skipSubs" };
          break;
        }
        case "gigantified-emote-message": {
          g = {
            type: "gigantifiedEmote",
            get emoteId() {
              let p = e.emotes[0], h = p.indices[p.indices.length - 1][1];
              for (let y = 1; y < e.emotes.length; y++) {
                let C = e.emotes[y], c = C.indices[C.indices.length - 1][1];
                c > h && (p = C, h = c);
              }
              return p.id;
            }
          };
          break;
        }
        case "animated-message": {
          g = {
            type: "messageEffects",
            animation: e.animationId
          };
          break;
        }
        default: {
          g = {
            type: "unknown",
            msgId: e.msgId
          };
          break;
        }
      }
    this.emit("message", {
      channel: n,
      user: {
        ...E(e),
        login: r.nick,
        isTurbo: e.turbo,
        isReturningChatter: e.returningChatter
      },
      message: {
        id: e.id,
        text: i,
        flags: e.flags,
        emotes: e.emotes,
        isAction: m,
        isFirst: e.firstMsg
      },
      sharedChat: l,
      announcement: void 0,
      cheer: d,
      parent: o,
      reward: g,
      tags: e
    });
  }
  handleUSERSTATE({ tags: e, channel: r }) {
    let a = this.getChannelByLogin(r) ?? this.getChannelPlaceholder(void 0, r), s = {
      id: this.identity.id,
      color: e.color,
      login: this.identity.name,
      display: e.displayName,
      badges: e.badges,
      badgeInfo: e.badgeInfo,
      isBroadcaster: e.badges.has("broadcaster"),
      isMod: e.mod,
      isSubscriber: e.subscriber,
      isFounder: e.badges.has("founder"),
      isTurbo: e.badges.has("turbo"),
      isVip: e.badges.has("vip"),
      type: e.userType
    };
    this.emit("userState", {
      channel: a,
      user: s
    });
  }
  handleGLOBALUSERSTATE({ tags: e }) {
    this.identity.id = e.userId, this.emit("globalUserState", {
      user: {
        id: e.userId,
        display: e.displayName,
        color: e.color,
        badges: e.badges,
        badgeInfo: e.badgeInfo,
        isTurbo: e.badges.has("turbo"),
        type: e.userType
      },
      emoteSets: e.emoteSets,
      tags: e
    });
  }
  handleUSERNOTICE({ tags: e, channel: r, params: a }) {
    let s = a[0], n = this.getChannelById(e.roomId) ?? this.getChannelPlaceholder(e.roomId, r), i = {
      ...E(e),
      login: e.login,
      isTurbo: "turbo" in e && e.turbo === !0,
      isReturningChatter: "returningChatter" in e && e.returningChatter === !0
    }, m;
    "msgParamGoalContributionType" in e && e.msgParamGoalContributionType && (m = {
      type: e.msgParamGoalContributionType,
      description: e.msgParamGoalDescription ?? "",
      current: e.msgParamGoalCurrentContributions,
      target: e.msgParamGoalTargetContributions,
      userContributions: e.msgParamGoalUserContributions
    });
    let l = "Prime", d = (o) => typeof o != "string" || o === l ? 1 : parseInt(o.slice(0, 1));
    switch (e.msgId) {
      case "announcement": {
        this.emit("message", {
          channel: n,
          user: i,
          message: {
            id: e.id,
            text: s,
            flags: e.flags,
            emotes: e.emotes,
            isAction: !1,
            isFirst: "firstMsg" in e && e.firstMsg === !0
          },
          sharedChat: void 0,
          announcement: {
            color: e.msgParamColor
          },
          cheer: void 0,
          parent: void 0,
          reward: void 0,
          tags: e
        });
        break;
      }
      case "sub": {
        this.emit("sub", {
          type: "sub",
          channel: n,
          user: i,
          plan: {
            name: e.msgParamSubPlanName,
            plan: e.msgParamSubPlan,
            tier: d(e.msgParamSubPlan),
            isPrime: e.msgParamSubPlan === l
          },
          multiMonth: {
            duration: e.msgParamMultimonthDuration ?? 0
          },
          goal: m,
          tags: e
        });
        break;
      }
      case "resub": {
        let o, g;
        e.msgParamShouldShareStreak && (o = {
          months: e.msgParamStreakMonths
        }), e.msgParamWasGifted && (g = {
          monthBeingRedeemed: e.msgParamGiftMonthBeingRedeemed,
          months: e.msgParamGiftMonths,
          gifter: {
            isAnon: e.msgParamAnonGift,
            id: e.msgParamGifterId,
            login: e.msgParamGifterLogin,
            display: e.msgParamGifterName
          }
        }), this.emit("sub", {
          type: "resub",
          channel: n,
          user: i,
          cumulativeMonths: e.msgParamCumulativeMonths,
          multiMonth: {
            duration: e.msgParamMultimonthDuration ?? 0,
            tenure: e.msgParamMultimonthTenure ?? 0
          },
          streak: o,
          plan: {
            name: e.msgParamSubPlanName,
            plan: e.msgParamSubPlan,
            tier: d(e.msgParamSubPlan),
            isPrime: e.msgParamSubPlan === l
          },
          gift: g,
          tags: e
        });
        break;
      }
      case "subgift": {
        let o;
        e.msgParamCommunityGiftId && (o = {
          id: e.msgParamCommunityGiftId
        }), this.emit("sub", {
          type: "subGift",
          channel: n,
          user: i,
          recipient: {
            id: e.msgParamRecipientId,
            login: e.msgParamRecipientUserName,
            display: e.msgParamRecipientDisplayName
          },
          plan: {
            name: e.msgParamSubPlanName,
            plan: e.msgParamSubPlan,
            tier: d(e.msgParamSubPlan),
            isPrime: e.msgParamSubPlan === l
          },
          gift: {
            months: e.msgParamGiftMonths,
            theme: e.msgParamGiftTheme,
            originId: e.msgParamOriginId
          },
          mystery: o,
          goal: m,
          tags: e
        });
        break;
      }
      case "submysterygift": {
        let o;
        "msgParamGiftMatch" in e && (o = {
          type: e.msgParamGiftMatch,
          bonusCount: e.msgParamGiftMatchBonusCount,
          extraCount: e.msgParamGiftMatchExtraCount,
          originalGifter: e.msgParamGiftMatchGifterDisplayName
        }), this.emit("sub", {
          type: "subMysteryGift",
          channel: n,
          user: i,
          plan: {
            name: void 0,
            plan: e.msgParamSubPlan,
            tier: d(e.msgParamSubPlan),
            isPrime: !1
          },
          mystery: {
            id: e.msgParamCommunityGiftId,
            count: e.msgParamMassGiftCount,
            theme: e.msgParamGiftTheme,
            gifterLifetimeCount: e.msgParamSenderCount
          },
          giftMatch: o,
          goal: m,
          tags: e
        });
        break;
      }
      case "standardpayforward": {
        this.emit("sub", {
          type: "standardPayForward",
          channel: n,
          user: i,
          recipient: {
            id: e.msgParamRecipientId,
            login: e.msgParamRecipientUserName,
            display: e.msgParamRecipientDisplayName
          },
          tags: e
        });
        break;
      }
      case "communitypayforward": {
        this.emit("sub", {
          type: "communityPayForward",
          channel: n,
          user: i,
          priorGifter: {
            isAnon: e.msgParamPriorGifterAnonymous,
            id: e.msgParamPriorGifterId,
            login: e.msgParamPriorGifterUserName,
            display: e.msgParamPriorGifterDisplayName
          },
          tags: e
        });
        break;
      }
      case "giftpaidupgrade": {
        this.emit("sub", {
          type: "giftPaidUpgrade",
          channel: n,
          user: i,
          gifter: {
            isAnon: e.msgParamSenderLogin === X,
            login: e.msgParamSenderLogin,
            display: e.msgParamSenderName
          },
          tags: e
        });
        break;
      }
      case "primepaidupgrade": {
        this.emit("sub", {
          type: "primePaidUpgrade",
          channel: n,
          user: i,
          plan: {
            name: void 0,
            plan: e.msgParamSubPlan,
            tier: d(e.msgParamSubPlan),
            isPrime: !1
          },
          tags: e
        });
        break;
      }
      case "raid": {
        this.emit("raid", {
          channel: n,
          user: {
            ...E(e),
            login: e.msgParamLogin
            // isTurbo: 'turbo' in tags && tags.turbo === true,
            // isReturningChatter: 'returningChatter' in tags && tags.returningChatter === true
          },
          viewers: e.msgParamViewerCount,
          tags: e
        });
        break;
      }
      case "bitsbadgetier": {
        this.emit("badgeUpgrade", {
          channel: n,
          user: i,
          type: "bits",
          threshold: e.msgParamThreshold,
          tags: e,
          message: {
            id: e.id,
            text: s,
            flags: e.flags,
            emotes: e.emotes,
            isAction: !1,
            isFirst: "firstMsg" in e && e.firstMsg === !0
          }
        });
        break;
      }
      case "sharedchatnotice": {
        let g = {
          channel: this.getChannelById(e.sourceRoomId) ?? this.getChannelPlaceholder(e.sourceRoomId, void 0),
          user: {
            badges: e.sourceBadges,
            badgeInfo: e.sourceBadgeInfo
          },
          message: {
            id: e.sourceId
          }
        };
        this.emit("sharedChatNotice", {
          type: e.sourceMsgId,
          channel: n,
          sharedChat: g,
          timestamp: e.tmiSentTs,
          tags: e
        });
        break;
      }
    }
  }
  handleNOTICE({ channel: e, tags: r, params: a }) {
    let { msgId: s } = r;
    if (!s) {
      let i = a[1];
      switch (this.close(), i) {
        case "Login authentication failed":
          break;
        case "Improperly formatted auth":
          let m = new Error(`Catatrophic error: ${i}`);
          this.emit("error", m);
      }
      return;
    }
    let n = this.getChannelByLogin(e) ?? this.getChannelPlaceholder(void 0, e);
    switch (s) {
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
      case "unrecognized_cmd":
        this.emit("messageDropped", {
          channel: n,
          reason: s,
          tags: r
        });
        break;
    }
  }
  handleCLEARCHAT({ channel: e, tags: r, params: a }) {
    let s = this.getChannelById(r.roomId) ?? this.getChannelPlaceholder(r.roomId, e), n = r.tmiSentTs;
    "banDuration" in r ? this.emit("moderation", {
      type: "timeout",
      channel: s,
      duration: r.banDuration,
      user: {
        id: r.targetUserId,
        login: a[0]
      },
      timestamp: n,
      tags: r
    }) : "targetUserId" in r ? this.emit("moderation", {
      type: "ban",
      channel: s,
      user: {
        id: r.targetUserId,
        login: a[0]
      },
      timestamp: n,
      tags: r
    }) : this.emit("moderation", {
      type: "clearChat",
      channel: s,
      timestamp: n,
      tags: r
    });
  }
  handleCLEARMSG({ tags: e, channel: r, params: a }) {
    let s = this.getChannelById(e.roomId) ?? this.getChannelPlaceholder(e.roomId, r);
    this.emit("moderation", {
      type: "deleteMessage",
      channel: s,
      user: {
        login: a[0]
      },
      message: {
        id: e.targetMsgId,
        text: a[0]
      },
      timestamp: e.tmiSentTs,
      tags: e
    });
  }
  handleROOMSTATE({ tags: e, channel: r }) {
    let a = this.getChannelById(e.roomId);
    a || (a = new u(e.roomId, r), this.channels.add(a), this.channelsById.set(e.roomId, a), this.channelsByLogin.set(r, a)), this.emit("roomState", {
      channel: a,
      emoteOnly: e.emoteOnly,
      followersOnly: e.followersOnly,
      unique: e.unique,
      slow: e.slow,
      subsOnly: e.subsOnly,
      tags: e
    });
  }
  handleJOIN(e) {
  }
  handlePART({ channel: e }) {
    let r = this.getChannelByLogin(e) ?? this.getChannelPlaceholder(void 0, e);
    this.emit("part", {
      channel: r
    });
  }
  handleWHISPER({ tags: e, prefix: r, params: a }) {
    let s = a[1], n = s.startsWith("/me ");
    n && (s = s.slice(4)), this.emit("whisper", {
      user: {
        id: e.userId,
        login: r.nick,
        display: e.displayName,
        color: e.color,
        badges: e.badges,
        isTurbo: e.turbo,
        type: e.userType
      },
      thread: {
        id: e.threadId
      },
      message: {
        id: e.messageId,
        text: s,
        emotes: e.emotes,
        isAction: n
      }
    });
  }
  handleRECONNECT(e) {
    this.reconnect();
  }
  handle376(e) {
    this.identity.name = e.params[0], this.emit("connect"), this.joinPendingChannels();
  }
  isConnected() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
  send(e) {
    if (!this.isConnected())
      throw new Error("Not connected");
    this.socket.send(e);
  }
  sendIrc(e) {
    let r = N({
      ...e,
      channel: e.channel?.toString()
    });
    if (!r)
      throw new Error("Result message is empty");
    this.send(r);
  }
  async join(e) {
    let r = typeof e == "string" ? u.toIrc(e) : e.toString(), a = this.waitForCommand(
      this.identity.isAnonymous() ? "JOIN" : "USERSTATE",
      (s) => s.channel === r && (s.prefix.nick ? s.prefix.nick === this.identity.name : !0),
      { channelHint: u.toIrc(e) }
    );
    this.sendIrc({ command: "JOIN", channel: r }), await a;
  }
  async part(e) {
    let r = typeof e == "string" ? u.toIrc(e) : e.toString(), a = this.waitForCommand(
      "PART",
      (s) => s.channel === r && s.prefix.nick === this.identity.name,
      { channelHint: u.toIrc(e) }
    );
    this.sendIrc({ command: "PART", channel: r }), await a;
  }
  async say(e, r, a = {}) {
    if (r.length === 0)
      throw new Error("Message cannot be empty");
    if (r.length > 500)
      throw new Error("Message is too long (max 500 characters)");
    let s = {
      "client-nonce": this.generateClientNonce(),
      ...a
    }, n = s["client-nonce"], i = this.waitForCommand(
      "USERSTATE",
      (m) => m.tags.clientNonce === n,
      { channelHint: u.toIrc(e) }
    );
    return this.sendIrc({
      command: "PRIVMSG",
      channel: e,
      params: [r],
      tags: s
    }), await i;
  }
  async reply(e, r, a, s = {}) {
    return this.say(e, r, {
      "reply-parent-msg-id": a,
      ...s
    });
  }
  generateClientNonce() {
    return `tmi.js-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)}`;
  }
  ping() {
    this.keepalive.lastPingSent = Date.now(), this.sendIrc({ command: "PING" }), this.keepalive.pingTimeout = setTimeout(() => this.reconnect(), this.keepalive.pingTimeoutSeconds * 1e3);
  }
  async joinPendingChannels() {
    for (let e of this.channelsPendingJoin)
      try {
        await this.join(e);
      } catch (r) {
        let a = new Error("Failed to join channel", { cause: r });
        this.emit("error", a);
      }
  }
  waitForCommand(e, r, a) {
    return new Promise((s, n) => {
      let i = a?.failOnDrop ?? !0, m = a?.timeoutMs ?? Math.max(1e3, Math.min(this.keepalive.maxWaitTimeoutMs, (this.keepalive.latencyMs ?? 500) * 2)), l = (p) => {
        p.command === e && (!r || r(p)) && (o(), clearTimeout(g), s(p));
      }, d = (p) => {
        a?.channelHint && p.channel.toString() !== a?.channelHint || (o(), n(new Error(`Message dropped: ${p.reason}`, { cause: p })));
      }, o = () => {
        this.off("ircMessage", l), i && this.off("messageDropped", d);
      }, g = setTimeout(() => {
        o();
        let p = new Error(
          `Did not receive command in time (Command: ${e}, Waited: ${m}ms)`,
          { cause: e }
        );
        n(p);
      }, m);
      this.on("ircMessage", l), i && this.on("messageDropped", d);
    });
  }
};

// src/index.ts
var Y = {
  Client: P,
  parseTag: T
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Client,
  parseTag
});
//# sourceMappingURL=tmi.node.cjs.map
