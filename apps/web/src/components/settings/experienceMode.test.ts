import { describe, expect, it } from "vite-plus/test";

import {
  isEngineerExperience,
  isSettingVisible,
  isSettingsPathVisible,
  isSettingsRowVisible,
  isSettingsSectionHeaderActionVisible,
} from "./experienceMode";

describe("experience mode settings policy", () => {
  it("keeps the full settings surface in engineer mode", () => {
    expect(isEngineerExperience("engineer")).toBe(true);
    expect(isSettingsPathVisible("engineer", "/settings/providers")).toBe(true);
    expect(isSettingsPathVisible("engineer", "/settings/diagnostics")).toBe(true);
    expect(isSettingVisible("engineer", "text-generation-model")).toBe(true);
    expect(isSettingsRowVisible("engineer", undefined, "Background activity")).toBe(true);
    expect(isSettingsSectionHeaderActionVisible("engineer", "Typography")).toBe(true);
  });

  it("keeps everyday settings visible for knowledge workers", () => {
    expect(isEngineerExperience("knowledge_worker")).toBe(false);
    expect(isSettingsPathVisible("knowledge_worker", "/settings/general")).toBe(true);
    expect(isSettingsPathVisible("knowledge_worker", "/settings/appearance")).toBe(true);
    expect(isSettingsPathVisible("knowledge_worker", "/settings/connections")).toBe(true);
    expect(isSettingsPathVisible("knowledge_worker", "/settings/archived")).toBe(true);
    expect(isSettingVisible("knowledge_worker", "time-format")).toBe(true);
    expect(isSettingVisible("knowledge_worker", "interface-font")).toBe(true);
    expect(isSettingVisible("knowledge_worker", "archive-confirmation")).toBe(true);
  });

  it("hides engineer-only routes and controls for knowledge workers", () => {
    for (const pathname of [
      "/settings/keybindings",
      "/settings/providers",
      "/settings/source-control",
      "/settings/diagnostics",
    ]) {
      expect(isSettingsPathVisible("knowledge_worker", pathname)).toBe(false);
    }

    for (const settingId of [
      "environment-identification",
      "prompt-font",
      "code-font",
      "terminal-font",
      "word-wrap",
      "project-grouping",
      "hide-whitespace-changes",
      "provider-update-checks",
      "new-threads",
      "add-project-starts-in",
      "text-generation-model",
      "diagnostics",
      "legacy-plan-mode",
    ]) {
      expect(isSettingVisible("knowledge_worker", settingId)).toBe(false);
    }

    expect(isSettingsRowVisible("knowledge_worker", undefined, "Background activity")).toBe(false);
    expect(isSettingsRowVisible("knowledge_worker", undefined, "Start from origin")).toBe(false);
    expect(isSettingsSectionHeaderActionVisible("knowledge_worker", "Typography")).toBe(false);
  });

  it("defaults unknown settings and sections to visible instead of silently dropping them", () => {
    expect(isSettingsPathVisible("knowledge_worker", "/settings/future-section")).toBe(true);
    expect(isSettingVisible("knowledge_worker", "future-setting")).toBe(true);
    expect(isSettingsRowVisible("knowledge_worker", undefined, "Future setting")).toBe(true);
    expect(isSettingsSectionHeaderActionVisible("knowledge_worker", "Future section")).toBe(true);
  });
});
