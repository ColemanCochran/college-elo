/**
 * ELO unit tests — run with: npx tsx lib/elo.test.ts
 */
import { expectedScore, calculateNewRatings, calcWinRate, ELO_DEFAULT, ELO_K_FACTOR } from "./elo";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertClose(a: number, b: number, tolerance: number, message: string) {
  assert(Math.abs(a - b) <= tolerance, `${message} (got ${a}, expected ~${b})`);
}

console.log("\n--- ELO Constants ---");
assert(ELO_DEFAULT === 1500, "Default ELO is 1500");
assert(ELO_K_FACTOR === 32, "K-factor is 32");

console.log("\n--- expectedScore ---");
assertClose(expectedScore(1500, 1500), 0.5, 0.001, "Equal ratings → 50% expected");
assertClose(expectedScore(1900, 1500), 0.909, 0.001, "400-point lead → ~91% expected");
assertClose(expectedScore(1500, 1900), 0.091, 0.001, "400-point deficit → ~9% expected");
assertClose(expectedScore(1700, 1500), 0.76, 0.01, "200-point lead → ~76% expected");
assert(expectedScore(2000, 1000) > 0.99, "Dominant favorite > 99%");
assert(expectedScore(1000, 2000) < 0.01, "Heavy underdog < 1%");

console.log("\n--- calculateNewRatings: equal match ---");
{
  const { winnerNew, loserNew } = calculateNewRatings(1500, 1500);
  assert(winnerNew === 1516, `Winner gains 16 ELO (got ${winnerNew})`);
  assert(loserNew === 1484, `Loser loses 16 ELO (got ${loserNew})`);
  assert(winnerNew + loserNew === 3000, "Total ELO is conserved");
}

console.log("\n--- calculateNewRatings: upset (underdog wins) ---");
{
  const { winnerNew, loserNew } = calculateNewRatings(1300, 1700);
  assert(winnerNew > 1300, "Underdog gains ELO after upset");
  assert(loserNew < 1700, "Favorite loses ELO after upset");
  assert(winnerNew - 1300 > 25, "Underdog gains more than 25 points (big upset)");
}

console.log("\n--- calculateNewRatings: expected win ---");
{
  const { winnerNew, loserNew } = calculateNewRatings(1700, 1300);
  assert(winnerNew > 1700, "Favorite still gains ELO");
  assert(loserNew < 1300, "Underdog still loses ELO");
  assert(winnerNew - 1700 < 10, "Favorite gains fewer than 10 points (expected win)");
}

console.log("\n--- calcWinRate ---");
assert(calcWinRate(0, 0) === 0, "0/0 = 0%");
assert(calcWinRate(5, 10) === 50, "5/10 = 50%");
assert(calcWinRate(10, 10) === 100, "10/10 = 100%");
assert(calcWinRate(1, 3) === 33.3, "1/3 = 33.3%");
assert(calcWinRate(2, 3) === 66.7, "2/3 = 66.7%");

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
