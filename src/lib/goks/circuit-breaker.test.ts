import assert from "node:assert/strict";
import { test } from "node:test";
import { FeedCircuitBreaker } from "./circuit-breaker.ts";

test("FeedCircuitBreaker stays CLOSED on successful calls", async () => {
  const cb = new FeedCircuitBreaker({ failureThreshold: 3 });
  assert.equal(cb.getState(), "CLOSED");

  const res = await cb.execute(
    async () => "live_data",
    () => "fallback_data"
  );
  assert.equal(res.data, "live_data");
  assert.equal(res.source, "live");
  assert.equal(cb.getState(), "CLOSED");
});

test("FeedCircuitBreaker trips to OPEN after reaching failureThreshold and recovers to HALF_OPEN", async () => {
  const cb = new FeedCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });

  // 1st failure
  await cb.execute(
    async () => {
      throw new Error("API Timeout");
    },
    () => "cached_fallback"
  );
  assert.equal(cb.getState(), "CLOSED");

  // 2nd failure -> trips circuit to OPEN
  const res2 = await cb.execute(
    async () => {
      throw new Error("HTTP 429 Too Many Requests");
    },
    () => "cached_fallback"
  );
  assert.equal(res2.data, "cached_fallback");
  assert.equal(res2.source, "fallback");
  assert.equal(cb.getState(), "OPEN");

  // While OPEN, operation is bypassed immediately without calling upstream
  let upstreamCalled = false;
  const res3 = await cb.execute(
    async () => {
      upstreamCalled = true;
      return "never_reached";
    },
    () => "instant_cache"
  );
  assert.equal(upstreamCalled, false);
  assert.equal(res3.data, "instant_cache");

  // Wait for resetTimeoutMs to elapse -> transitions to HALF_OPEN
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(cb.getState(), "HALF_OPEN");
});

