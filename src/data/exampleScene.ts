import { SceneDefinition } from "../types/scene";

export const exampleScene: SceneDefinition = {
  id: "store-counter-dispute",
  duration: 90,
  characters: [
    { id: "customer", baselineTone: 0.1 },
    { id: "clerk", baselineTone: 0.05 },
    { id: "security", baselineTone: 0 },
  ],
  events: [
    { id: "evt-customer-agitated", time: 8, actor: "customer", toneShift: 0.45 },
    { id: "evt-clerk-tense", time: 18, actor: "clerk", toneShift: 0.3 },
    { id: "evt-security-intervenes", time: 34, actor: "security", toneShift: -0.25 },
    { id: "evt-customer-settles", time: 55, actor: "customer", toneShift: -0.35 },
    { id: "evt-clerk-recovers", time: 68, actor: "clerk", toneShift: -0.2 },
    { id: "evt-security-steps-back", time: 78, actor: "security", toneShift: 0.1 },
  ],
  decay: {
    enabled: true,
    decayRatePerSecond: 0.02,
  },
};
