const ACTION_MESSAGE_PREFIX = '\u0001ACTION ';
const ACTION_MESSAGE_SUFFIX = '\u0001';
const ACTION_MESSAGE_PREFIX_LENGTH = ACTION_MESSAGE_PREFIX.length;
const ACTION_MESSAGE_SUFFIX_LENGTH = ACTION_MESSAGE_SUFFIX.length;

export function isActionMessage(text: string) {
	return text.startsWith(ACTION_MESSAGE_PREFIX) && text.endsWith(ACTION_MESSAGE_SUFFIX);
}

export function trimActionMessage(text: string) {
	return text.slice(ACTION_MESSAGE_PREFIX_LENGTH, -ACTION_MESSAGE_SUFFIX_LENGTH);
}