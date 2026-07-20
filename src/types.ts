export type Indices = [ start: number, end: number ];

export interface Emote {
	type: 'emote';
	id: string;
	indices: Indices[];
}

export interface GIF {
	type: 'gif';
	id: string;
	indices: Indices[];
	url: string;
}

export interface MessageFlag {
	index: Indices;
	/**
	 * Flags:
	 * - `A`: Aggressive Content
	 * - `I`: Identity-Based Hate
	 * - `P`: Profane Content
	 * - `S`: Sexual Content
	 */
	flags: Record<'A' | 'I' | 'P' | 'S', number>;
	text: string;
}