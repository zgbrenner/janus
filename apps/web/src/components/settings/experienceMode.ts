export type ExperienceMode = "engineer" | "knowledge_worker";

const ENGINEER_ONLY_SETTINGS_PATHS: ReadonlySet<string> = new Set([
  "/settings/keybindings",
  "/settings/providers",
  "/settings/source-control",
  "/settings/diagnostics",
]);

const ENGINEER_ONLY_SETTING_IDS: ReadonlySet<string> = new Set([
  "environment-identification",
  "prompt-font",
  "code-font",
  "terminal-font",
  "font-smoothing",
  "word-wrap",
  "project-grouping",
  "hide-whitespace-changes",
  "provider-update-checks",
  "new-threads",
  "start-from-origin",
  "add-project-starts-in",
  "text-generation-model",
  "diagnostics",
  "legacy-plan-mode",
  "legacy-token-streaming",
  "legacy-sidebar",
  "keybindings",
  "providers",
  "source-control",
]);

const ENGINEER_ONLY_SETTING_TITLES: ReadonlySet<string> = new Set([
  "Background activity",
  "Start from origin",
]);

const ENGINEER_ONLY_SECTION_HEADER_ACTIONS: ReadonlySet<string> = new Set(["Typography"]);

export function isEngineerExperience(mode: ExperienceMode): boolean {
  return mode === "engineer";
}

export function isSettingsPathVisible(mode: ExperienceMode, pathname: string): boolean {
  return isEngineerExperience(mode) || !ENGINEER_ONLY_SETTINGS_PATHS.has(pathname);
}

export function isSettingVisible(mode: ExperienceMode, settingId: string): boolean {
  return isEngineerExperience(mode) || !ENGINEER_ONLY_SETTING_IDS.has(settingId);
}

export function isSettingsRowVisible(
  mode: ExperienceMode,
  settingId: string | undefined,
  title: string | null,
): boolean {
  if (isEngineerExperience(mode)) return true;
  if (settingId && ENGINEER_ONLY_SETTING_IDS.has(settingId)) return false;
  return title === null || !ENGINEER_ONLY_SETTING_TITLES.has(title);
}

export function isSettingsSectionHeaderActionVisible(
  mode: ExperienceMode,
  sectionTitle: string,
): boolean {
  return isEngineerExperience(mode) || !ENGINEER_ONLY_SECTION_HEADER_ACTIONS.has(sectionTitle);
}
