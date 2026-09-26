import confetti from "canvas-confetti";

export function celebrate(): void {
  confetti({
    particleCount: 70,
    spread: 62,
    origin: { y: 0.72 },
    colors: ["#4f46e5", "#0d9488", "#22c55e", "#f59e0b"],
  });
}
