import { describe, expect, it } from "vitest";
import { tokenizeJsonForHighlight } from "./json-highlight";

describe("JSON highlighting", () => {
    it("preserves JSON text while classifying common token types", () => {
        const json = `{
  "data": {
    "regNo": "1ABC234",
    "active": true,
    "odometer": 123456,
    "driver": null
  }
}`;

        const tokens = tokenizeJsonForHighlight(json);

        expect(tokens.map((token) => token.text).join("")).toBe(json);
        expect(tokens).toContainEqual({ kind: "key", text: '"regNo"' });
        expect(tokens).toContainEqual({ kind: "string", text: '"1ABC234"' });
        expect(tokens).toContainEqual({ kind: "boolean", text: "true" });
        expect(tokens).toContainEqual({ kind: "number", text: "123456" });
        expect(tokens).toContainEqual({ kind: "null", text: "null" });
    });
});
