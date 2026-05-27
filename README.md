# Obsidian QuickAdd

Run Obsidian QuickAdd choices from Raycast.

## Features

- Automatically detects Obsidian vaults from the macOS Obsidian configuration.
- Reads QuickAdd choices from all detected vaults.
- Searches and runs QuickAdd choices from a Raycast list command.
- Sends text entered in Raycast Root Search to a QuickAdd choice.
- Supports custom QuickAdd variable names such as `{{VALUE:value}}`.

## Setup

Install and configure the QuickAdd plugin in Obsidian first. The extension reads choices from:

```text
<vault>/.obsidian/plugins/quickadd/data.json
```

By default, the extension scans all vaults detected from:

```text
~/Library/Application Support/obsidian/obsidian.json
```

If automatic detection does not find the right vault, open Raycast Preferences and set:

- `Vault Path`: the local vault directory. When set, only this vault is scanned, and its folder name is used as the Obsidian vault name.
- `Default Variable Name`: defaults to `value`, matching `{{VALUE:value}}`.

## Commands

- **Search QuickAdd Choices**: search choices, enter text, and run QuickAdd.
- **Send to QuickAdd**: pass text from Raycast Root Search, pick a choice, and send it to Obsidian.

To show **Send to QuickAdd** under arbitrary Root Search text, open **Manage Fallback Commands** in Raycast, enable **Send to QuickAdd**, and move it to the desired position. Raycast controls fallback command visibility and ordering.

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
