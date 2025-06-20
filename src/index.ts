import { Client } from './Client';
export { Client } from './Client';
export type * from './Client';
import { parseTag } from './irc';
export * from './irc';
export * from './twitch/events';
export { default as Channel, ChannelPlaceholder } from './lib/Channel';

export default {
	Client,
	parseTag
};