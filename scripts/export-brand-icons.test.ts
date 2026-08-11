import { assert, describe, it } from "vite-plus/test";

import { readPngDimensions } from "./lib/icon-export.ts";
import { renderJanusSvg, renderJanusVariant } from "./export-brand-icons.ts";

describe("export-brand-icons", () => {
  it("renders deterministic Janus production icon dimensions and an ICO bundle", async () => {
    const variant = {
      label: "production",
      source: "assets/prod/app-icon.icon",
      outputs: {
        ios: "ios.png",
        macos: "macos.png",
        universal: "universal.png",
        appleTouch: "apple-touch.png",
        favicon16: "favicon-16.png",
        favicon32: "favicon-32.png",
        faviconIco: "favicon.ico",
        windowsIco: "windows.ico",
      },
    } as const;
    const first = await renderJanusVariant(variant);
    const second = await renderJanusVariant(variant);

    assert.deepEqual(first.get("ios.png"), second.get("ios.png"));
    assert.deepEqual(readPngDimensions(first.get("ios.png")!), { width: 1024, height: 1024 });
    assert.deepEqual(readPngDimensions(first.get("macos.png")!), { width: 1024, height: 1024 });
    assert.deepEqual(readPngDimensions(first.get("favicon-16.png")!), { width: 16, height: 16 });
    assert.deepEqual(readPngDimensions(first.get("favicon-32.png")!), { width: 32, height: 32 });
    assert.deepEqual(first.get("windows.ico")?.subarray(0, 4), Buffer.from([0, 0, 1, 0]));
    assert.include(renderJanusSvg(variant, 128).toString(), "#18352A");
  });
});
