import test from "node:test";
import assert from "node:assert/strict";
import { mergeFields, stripHtml } from "../lib/personalize";
import { safeEqual, signedToken } from "../lib/security";

test("personalisation escapes contact data and replaces supported fields", () => {
  const result = mergeFields("Hello {{first_name}} at {{company}} ({{email}})", { firstName: "<Sam>", company: "A&B", email: "sam@example.com" });
  assert.equal(result, "Hello &lt;Sam&gt; at A&amp;B (sam@example.com)");
});
test("plain text fallback removes markup", () => assert.equal(stripHtml("<h1>Hello</h1><p>there</p>"), "Hello there"));
test("unsubscribe signatures are stable and tamper evident", () => { const token=signedToken("recipient-1"); assert.equal(safeEqual(token,signedToken("recipient-1")),true); assert.equal(safeEqual(token,signedToken("recipient-2")),false); });
