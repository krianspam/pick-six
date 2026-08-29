import { scoreHeadToHead } from "./scoring";
const a = (home: number, away: number) => ({ userId: "a", home, away });
const b = (home: number, away: number) => ({ userId: "b", home, away });
describe("head-to-head scoring hierarchy", () => {
  test("unique exact score earns 3", () => expect(scoreHeadToHead(2, 1, a(2, 1), b(1, 0))).toEqual({ userId: "a", points: 3, reason: "exact" }));
  test("two exact scores cancel out", () => expect(scoreHeadToHead(2, 1, a(2, 1), b(2, 1)).points).toBe(0));
  test("unique exact goal difference earns 2", () => expect(scoreHeadToHead(3, 1, a(2, 0), b(1, 0))).toEqual({ userId: "a", points: 2, reason: "goal_difference" }));
  test("equal exact goal differences cancel out", () => expect(scoreHeadToHead(3, 1, a(2, 0), b(4, 2)).points).toBe(0));
  test("closest goal difference earns 1", () => expect(scoreHeadToHead(4, 1, a(2, 0), b(1, 0))).toEqual({ userId: "a", points: 1, reason: "closest" }));
  test("equally close predictions cancel out", () => expect(scoreHeadToHead(4, 1, a(2, 0), b(5, 1)).points).toBe(0));
  test("one prediction wins a walkover", () => expect(scoreHeadToHead(2, 0, a(9, 9))).toEqual({ userId: "a", points: 1, reason: "walkover" }));
  test("no predictions award nothing", () => expect(scoreHeadToHead(2, 0)).toEqual({ userId: null, points: 0, reason: "none" }));
  test("draw goal differences are handled", () => expect(scoreHeadToHead(1, 1, a(2, 2), b(2, 1))).toEqual({ userId: "a", points: 2, reason: "goal_difference" }));
});
