# Obsidian QuickAdd

Run Obsidian QuickAdd choices from Raycast.

## Features

- Automatically detects Obsidian vaults from the macOS Obsidian configuration.
- Switches between detected vaults from inside Raycast and remembers the selected vault.
- Reads QuickAdd choices from the selected vault.
- Searches and runs QuickAdd choices from a Raycast list command.
- Sends text entered in Raycast Root Search to a QuickAdd choice.
- Supports custom QuickAdd variable names such as `{{VALUE:value}}`.

## Setup

Install and configure the QuickAdd plugin in Obsidian first. The extension reads choices from:

```text
<vault>/.obsidian/plugins/quickadd/data.json
```

By default, the extension detects the open or most recently used vault from:

```text
~/Library/Application Support/obsidian/obsidian.json
```

If you use multiple vaults, run **Switch Vault** from the action panel to pick a detected vault. The selected vault is remembered for future launches.

If automatic detection does not find the right vault, open Raycast Preferences and set:

- `Vault Name`: the Obsidian vault name or ID used in the `obsidian://quickadd` URI.
- `Vault Path`: the local vault directory.
- `Default Variable Name`: defaults to `value`, matching `{{VALUE:value}}`.

## Commands

- **Search QuickAdd Choices**: search choices, enter text, and run QuickAdd.
- **Send Text to QuickAdd**: pass text from Raycast Root Search, pick a choice, and send it to Obsidian.

## Publishing

Development happens in the personal repository first. To submit or update the official Raycast Store pull request:

```bash
npm run lint
npm run build
npm run publish
```

If the publish command reports upstream contribution conflicts, run:

```bash
npx @raycast/api@latest pull-contributions
```
