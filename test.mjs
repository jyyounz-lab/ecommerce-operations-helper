import assert from "node:assert/strict";
import { calculators, evaluate } from "./calculators.js";
const cases = [[{ price: 1000, cost: 650 }, .35], [{ purchase: 650, margin: 35 }, 1000], [{ price: 1000, margin: 35 }, 650], [{ fixedCost: 100000, margin: 35 }, 285714.28571428574], [{ targetProfit: 200000, fixedCost: 100000, margin: 35 }, 857142.8571428572], [{ impressions: 100000, clickRate: 2, conversionRate: 3, orderValue: 1200 }, 72000]];
cases.forEach(([input, expected], index) => assert.ok(Math.abs(evaluate(calculators[index], input).result - expected) < 1e-8));
assert.equal(evaluate(calculators[0], { price: 0, cost: 0 }).result, null);
assert.equal(evaluate(calculators[1], { purchase: 100, margin: 100 }).result, null);
assert.equal(evaluate(calculators[5], { impressions: -1, clickRate: 2, conversionRate: 3, orderValue: 100 }).result, null);
console.log("All calculator checks passed.");
