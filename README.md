# @tmi.js/chat

Connect to Twitch IRC chat.

# Install

```bash
npm i @tmi.js/chat
```

# Usage

```ts
import tmi from '@tmi.js/chat';

const client = new tmi.Client({ channels: [ CHANNEL_NAME ], token: AUTH_TOKEN });

client.connect();

client.on('message', e => {
	const { channel, user, message } = e;
	console.log(`[${channel.login}] ${user.login}: ${message.text}`);
});
```