import { assert, describe, it } from "vite-plus/test";

import { readPngDimensions } from "./lib/icon-export.ts";
import {
  ICON_VARIANTS,
  renderJanusSvg,
  renderJanusVariant,
} from "./export-brand-icons.ts";

describe("export-brand-icons", () => {
  it("renders deterministic Janus production icon dimensions and an ICO bundle", async () => {
    const variant = ICON_VARIANTS[2];
    const first = await renderJanusVariant(variant);
    const second = await renderJanusVariant(variant);

    assert.deepEqual(
      first.get(variant.outputs.ios),
      second.get(variant.outputs.ios),
    );
    assert.deepEqual(readPngDimensions(first.get(variant.outputs.ios)!), {
      width: 1024,
      height: 1024,
    });
    assert.deepEqual(readPngDimensions(first.get(variant.outputs.macos)!), {
      width: 1024,
      height: 1024,
    });
    assert.deepEqual(readPngDimensions(first.get(variant.outputs.favicon16)!), {
      width: 16,
      height: 16,
    });
    assert.deepEqual(readPngDimensions(first.get(variant.outputs.favicon32)!), {
      width: 32,
      height: 32,
    });
    assert.deepEqual(
      first.get(variant.outputs.windowsIco)?.subarray(0, 4),
      Buffer.from([0, 0, 1, 0]),
    );
    assert.include(renderJanusSvg(variant, 128).toString(), "#18352A");
  });
});
