import { getPredictionWindow } from "./prediction-window";

describe("24-hour prediction window", () => {
  const kickoff = new Date("2026-06-21T18:00:00.000Z");
  test("is scheduled before the 24-hour mark", () => expect(getPredictionWindow(kickoff, new Date("2026-06-20T17:59:59.999Z")).state).toBe("scheduled"));
  test("opens exactly 24 hours before kickoff", () => expect(getPredictionWindow(kickoff, new Date("2026-06-20T18:00:00.000Z")).isOpen).toBe(true));
  test("stays open until immediately before kickoff", () => expect(getPredictionWindow(kickoff, new Date("2026-06-21T17:59:59.999Z")).isOpen).toBe(true));
  test("closes exactly at kickoff", () => expect(getPredictionWindow(kickoff, kickoff).state).toBe("closed"));
});
