/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Vault Name - Optional Obsidian vault name or ID for the manually configured Vault Path. */
  "vaultName"?: string,
  /** Vault Path - Optional Obsidian vault path. Leave empty to automatically scan all detected vaults. */
  "vaultPath"?: string,
  /** Default Variable Name - The QuickAdd variable name used in the URI parameter value-<name>. */
  "defaultVariableName": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quickadd` command */
  export type Quickadd = ExtensionPreferences & {}
  /** Preferences accessible in the `quickadd-with-text` command */
  export type QuickaddWithText = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quickadd` command */
  export type Quickadd = {}
  /** Arguments passed to the `quickadd-with-text` command */
  export type QuickaddWithText = {
  /** Text */
  "text": string
}
}

