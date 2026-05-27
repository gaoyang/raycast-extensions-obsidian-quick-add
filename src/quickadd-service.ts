import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { homedir } from "node:os";
import { LocalStorage, getPreferenceValues } from "@raycast/api";
import {
  buildQuickAddUri,
  extractChoices,
  getQuickAddConfigPath,
  normalizeVariableName,
  normalizeVaults,
  type QuickAddChoice,
  type QuickAddState,
  type Vault,
} from "./quickadd-core";

export {
  buildQuickAddUri,
  extractChoices,
  getQuickAddConfigPath,
  normalizeVariableName,
  type QuickAddChoice,
  type QuickAddState,
  type Vault,
};

type PreferencesShape = {
  vaultName?: string;
  vaultPath?: string;
  defaultVariableName?: string;
};

const CACHE_KEY_PREFIX = "obsidian-quickadd.cache.";
const SELECTED_VAULT_KEY = "obsidian-quickadd.selected-vault";

type StoredVaultSelection = {
  id: string;
  path: string;
  name: string;
};

export function getDefaultVariableName() {
  const preferences = getPreferenceValues<PreferencesShape>();
  return normalizeVariableName(preferences.defaultVariableName);
}

export function getObsidianConfigPath() {
  return join(homedir(), "Library", "Application Support", "obsidian", "obsidian.json");
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
}

export async function detectVaults(configPath = getObsidianConfigPath()): Promise<Vault[]> {
  if (!existsSync(configPath)) return [];

  const config = await readJsonFile<{ vaults?: Record<string, { path?: string; open?: boolean; ts?: number }> }>(
    configPath,
  );
  return normalizeVaults(config.vaults);
}

function getCacheKey(vault: Vault) {
  return `${CACHE_KEY_PREFIX}${encodeURIComponent(vault.path)}`;
}

async function getSelectedVaultFromStorage(): Promise<StoredVaultSelection | null> {
  const value = await LocalStorage.getItem<string>(SELECTED_VAULT_KEY);
  if (!value) return null;

  try {
    const selection = JSON.parse(value) as StoredVaultSelection;
    return selection?.path ? selection : null;
  } catch {
    return null;
  }
}

export async function setSelectedVault(vault: Vault): Promise<void> {
  await LocalStorage.setItem(
    SELECTED_VAULT_KEY,
    JSON.stringify({
      id: vault.id,
      path: vault.path,
      name: vault.name,
    } satisfies StoredVaultSelection),
  );
}

export async function resolveVault(): Promise<Vault> {
  const preferences = getPreferenceValues<PreferencesShape>();
  const preferencePath = String(preferences.vaultPath || "").trim();
  const preferenceName = String(preferences.vaultName || "").trim();

  if (preferencePath) {
    return {
      id: preferenceName || basename(preferencePath),
      name: preferenceName || basename(preferencePath),
      path: preferencePath,
      open: false,
      ts: 0,
    };
  }

  const vaults = await detectVaults();
  const selectedVault = await getSelectedVaultFromStorage();
  const vault =
    (selectedVault
      ? vaults.find((candidate) => candidate.id === selectedVault.id || candidate.path === selectedVault.path)
      : undefined) || vaults[0];

  if (!vault) {
    throw new Error("No Obsidian vault was detected. Set a Vault Path in the extension preferences.");
  }

  return preferenceName ? { ...vault, name: preferenceName, id: preferenceName } : vault;
}

export async function loadQuickAddState(options: { allowCache?: boolean } = {}): Promise<QuickAddState> {
  let vault: Vault | undefined;

  try {
    vault = await resolveVault();
    const configPath = getQuickAddConfigPath(vault.path);

    if (!existsSync(configPath)) {
      throw new Error(`QuickAdd config was not found: ${configPath}`);
    }

    const data = await readJsonFile<unknown>(configPath);
    const choices = extractChoices(data);
    const state: QuickAddState = {
      vault,
      choices,
      refreshedAt: new Date().toISOString(),
      fromCache: false,
    };

    await LocalStorage.setItem(getCacheKey(vault), JSON.stringify(state));
    return state;
  } catch (error) {
    if (options.allowCache && vault) {
      const cached = await getCachedState(vault);
      if (cached) return { ...cached, fromCache: true };
    }
    throw error;
  }
}

export async function getCachedState(vault: Vault): Promise<QuickAddState | null> {
  const value = await LocalStorage.getItem<string>(getCacheKey(vault));
  if (!value) return null;

  try {
    return JSON.parse(value) as QuickAddState;
  } catch {
    return null;
  }
}
