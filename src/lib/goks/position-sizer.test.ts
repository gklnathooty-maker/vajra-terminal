import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePositionSize } from "./position-sizer.ts";

test("calculatePositionSize correctly computes exact shares based on max risk amount", () => {
  // Account ₹10,00,000, 1% risk = ₹10,000 risk
  // Entry 1000, SL 950 (risk per share = 50)
  // Max shares = 10,000 / 50 = 200 shares
  const result = calculatePositionSize({
    accountCapital: 1_000_000,
    riskPercent: 1.0,
    entryPrice: 1000,
    stopLossPrice: 950,
    targetPrice: 1150,
  });

  assert.equal(result.maxShares, 200);
  assert.equal(result.capitalAtRisk, 10_000);
  assert.equal(result.positionCapital, 200_000);
  assert.equal(result.potentialProfit, 30_000); // 200 * 150
  assert.equal(result.riskRewardRatio, 3.0); // 150 / 50
  assert.equal(result.isTradeViable, true);
});

test("calculatePositionSize warns on sub-par risk-reward and handles zero risk", () => {
  const badRR = calculatePositionSize({
    accountCapital: 500_000,
    riskPercent: 1.0,
    entryPrice: 1000,
    stopLossPrice: 900,
    targetPrice: 1050, // 50 gain vs 100 loss -> RR 0.5
  });

  assert.ok(badRR.warnings.some((w) => w.includes("Risk-Reward ratio")));

  const zeroRisk = calculatePositionSize({
    accountCapital: 500_000,
    riskPercent: 1.0,
    entryPrice: 1000,
    stopLossPrice: 1000,
    targetPrice: 1100,
  });
  assert.equal(zeroRisk.maxShares, 0);
  assert.equal(zeroRisk.isTradeViable, false);
});

