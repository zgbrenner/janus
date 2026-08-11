import { describe, expect, it } from "vite-plus/test";

import { STANDARD_THEME_CARDS } from "./ThemePreviewCircles";

describe("STANDARD_THEME_CARDS", () => {
  it("labels the unthemed compatibility palette as Default", () => {
    expect(STANDARD_THEME_CARDS).toMatchObject([{ id: "default", label: "Default" }]);
  });
});
