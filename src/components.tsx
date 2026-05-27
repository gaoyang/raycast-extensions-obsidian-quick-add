import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  Toast,
  closeMainWindow,
  open,
  openExtensionPreferences,
  popToRoot,
  showToast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  QuickAddChoice,
  QuickAddState,
  buildQuickAddUri,
  detectVaults,
  getDefaultVariableName,
  getQuickAddConfigPath,
  loadQuickAddState,
  setSelectedVault,
  type Vault,
} from "./quickadd-service";

type ChoiceListProps = {
  initialText?: string;
  directSend?: boolean;
};

export function ChoiceList({ initialText = "", directSend = false }: ChoiceListProps) {
  const [state, setState] = useState<QuickAddState | null>(null);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  async function load(allowCache = true) {
    setIsLoading(true);
    setError(undefined);

    try {
      const nextState = await loadQuickAddState({ allowCache });
      setState(nextState);
      if (nextState.fromCache) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Using Cached Choices",
          message: "Refresh failed, so the last loaded QuickAdd choices are shown.",
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const choices = state?.choices || [];
  const searchBarPlaceholder = initialText ? "Search choice to receive the provided text" : "Search QuickAdd choices";

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={searchBarPlaceholder}
      navigationTitle="Obsidian QuickAdd"
      isShowingDetail={Boolean(state)}
    >
      {error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Load QuickAdd Choices"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Refresh Choices" icon={Icon.ArrowClockwise} onAction={() => load(false)} />
              <Action.Push title="Switch Vault" icon={Icon.Folder} target={<VaultList onSelect={() => load(false)} />} />
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : choices.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.List}
          title="No QuickAdd Choices Found"
          description="Check that QuickAdd is installed and has choices configured in this vault."
          actions={
            <ActionPanel>
              <Action title="Refresh Choices" icon={Icon.ArrowClockwise} onAction={() => load(false)} />
              <Action.Push title="Switch Vault" icon={Icon.Folder} target={<VaultList onSelect={() => load(false)} />} />
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : (
        choices.map((choice) => (
          <ChoiceListItem
            key={choice.name}
            choice={choice}
            state={state}
            initialText={initialText}
            directSend={directSend}
            onRefresh={() => load(false)}
          />
        ))
      )}
    </List>
  );
}

function ChoiceListItem({
  choice,
  state,
  initialText,
  directSend,
  onRefresh,
}: {
  choice: QuickAddChoice;
  state: QuickAddState | null;
  initialText: string;
  directSend: boolean;
  onRefresh: () => void;
}) {
  const group = choice.group ? ` · ${choice.group}` : "";
  const vaultName = state?.vault.name || "";
  const detail = [
    `# ${choice.name}`,
    "",
    `**Type:** ${choice.type}${group}`,
    `**Vault:** ${vaultName || "Default Obsidian Vault"}`,
    state?.fromCache ? "" : undefined,
    state?.fromCache ? "**Note:** Showing cached choices because the latest refresh failed." : undefined,
    initialText ? "" : undefined,
    initialText ? `**Input:** ${initialText}` : undefined,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return (
    <List.Item
      icon={Icon.Document}
      title={choice.name}
      subtitle={choice.group || choice.type}
      accessories={[{ text: choice.type }]}
      detail={<List.Item.Detail markdown={detail} />}
      actions={
        <ActionPanel>
          {directSend ? (
            <Action
              title="Send to QuickAdd"
              icon={Icon.Airplane}
              onAction={() =>
                runChoice({
                  choice,
                  vaultName,
                  variableName: getDefaultVariableName(),
                  value: initialText,
                })
              }
            />
          ) : (
            <Action.Push
              title="Enter Text"
              icon={Icon.Text}
              target={<ChoiceForm choice={choice} vaultName={vaultName} initialValue={initialText} />}
            />
          )}
          {directSend ? (
            <Action.Push
              title="Edit Text Before Sending"
              icon={Icon.Pencil}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
              target={<ChoiceForm choice={choice} vaultName={vaultName} initialValue={initialText} />}
            />
          ) : (
            <Action.Push
              title="Enter Text with Options"
              icon={Icon.Pencil}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
              target={<ChoiceForm choice={choice} vaultName={vaultName} initialValue={initialText} />}
            />
          )}
          <Action
            title="Refresh Choices"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={onRefresh}
          />
          <Action.Push
            title="Switch Vault"
            icon={Icon.Folder}
            shortcut={{ modifiers: ["cmd"], key: "v" }}
            target={<VaultList onSelect={onRefresh} />}
          />
          <Action
            title="Open Extension Preferences"
            icon={Icon.Gear}
            shortcut={{ modifiers: ["cmd"], key: "," }}
            onAction={openExtensionPreferences}
          />
        </ActionPanel>
      }
    />
  );
}

function ChoiceForm({
  choice,
  vaultName,
  initialValue,
}: {
  choice: QuickAddChoice;
  vaultName: string;
  initialValue: string;
}) {
  const defaultVariableName = getDefaultVariableName();

  return (
    <Form
      navigationTitle={choice.name}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Run QuickAdd"
            icon={Icon.Airplane}
            onSubmit={(values: { variableName: string; value: string }) =>
              runChoice({
                choice,
                vaultName,
                variableName: values.variableName,
                value: values.value,
              })
            }
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Choice" text={choice.group ? `${choice.name} · ${choice.group}` : choice.name} />
      <Form.TextField id="variableName" title="Variable Name" defaultValue={defaultVariableName} />
      <Form.TextArea id="value" title="Text" defaultValue={initialValue} autoFocus />
    </Form>
  );
}

function VaultList({ onSelect }: { onSelect: () => void }) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  async function loadVaults() {
    setIsLoading(true);
    setError(undefined);

    try {
      setVaults(await detectVaults());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setVaults([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVaults();
  }, []);

  return (
    <List isLoading={isLoading} navigationTitle="Switch Obsidian Vault" searchBarPlaceholder="Search vaults">
      {error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Detect Vaults"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Refresh Vaults" icon={Icon.ArrowClockwise} onAction={loadVaults} />
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : vaults.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No Obsidian Vaults Detected"
          description="Open Obsidian once or set a Vault Path in extension preferences."
          actions={
            <ActionPanel>
              <Action title="Refresh Vaults" icon={Icon.ArrowClockwise} onAction={loadVaults} />
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : (
        vaults.map((vault) => (
          <VaultListItem key={`${vault.id}:${vault.path}`} vault={vault} onSelect={onSelect} onRefresh={loadVaults} />
        ))
      )}
    </List>
  );
}

function VaultListItem({ vault, onSelect, onRefresh }: { vault: Vault; onSelect: () => void; onRefresh: () => void }) {
  const accessories = [
    vault.open ? { text: "Open", icon: Icon.CheckCircle } : undefined,
    vault.ts ? { date: new Date(vault.ts) } : undefined,
  ].filter((accessory): accessory is NonNullable<typeof accessory> => Boolean(accessory));

  return (
    <List.Item
      icon={Icon.Folder}
      title={vault.name}
      subtitle={vault.path}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title="Use Vault"
            icon={Icon.CheckCircle}
            onAction={async () => {
              await setSelectedVault(vault);
              await showToast({ style: Toast.Style.Success, title: "Vault Selected", message: vault.name });
              await popToRoot({ clearSearchBar: true });
              onSelect();
            }}
          />
          <Action.Open title="Open Vault Folder" target={vault.path} icon={Icon.Finder} />
          <Action.Open title="Open QuickAdd Config" target={getQuickAddConfigPath(vault.path)} icon={Icon.Document} />
          <Action title="Refresh Vaults" icon={Icon.ArrowClockwise} onAction={onRefresh} />
        </ActionPanel>
      }
    />
  );
}

async function runChoice({
  choice,
  vaultName,
  variableName,
  value,
}: {
  choice: QuickAddChoice;
  vaultName: string;
  variableName: string;
  value: string;
}) {
  try {
    const uri = buildQuickAddUri({
      vaultName,
      choiceName: choice.name,
      variableName,
      value,
    });

    await open(uri);
    await showToast({ style: Toast.Style.Success, title: "Sent to QuickAdd", message: choice.name });
    await popToRoot({ clearSearchBar: true });
    await closeMainWindow();
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could Not Run QuickAdd",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
