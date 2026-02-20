import { useCallback, useRef, useEffect } from "react";

interface TransitionFeedbackOptions {
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
}

export const useTransitionFeedback = ({
  soundEnabled = true,
  hapticEnabled = true,
}: TransitionFeedbackOptions = {}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };

    document.addEventListener("click", initAudio);
    document.addEventListener("touchstart", initAudio);

    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
  }, []);

  const playTransitionSound = useCallback(
    (direction: "forward" | "backward" = "forward") => {
      if (!soundEnabled || prefersReducedMotion.current) return;

      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Resume context if suspended
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create a subtle "whoosh" sound using oscillators
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different frequencies for forward/backward
      const baseFreq = direction === "forward" ? 800 : 600;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        direction === "forward" ? 1200 : 400,
        ctx.currentTime + 0.1
      );

      // Subtle volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.12);
    },
    [soundEnabled]
  );

  const triggerHaptic = useCallback(() => {
    if (!hapticEnabled || prefersReducedMotion.current) return;

    // Check if Vibration API is available
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // Very subtle 10ms vibration
    }
  }, [hapticEnabled]);

  const triggerTransitionFeedback = useCallback(
    (direction: "forward" | "backward" = "forward") => {
      playTransitionSound(direction);
      triggerHaptic();
    },
    [playTransitionSound, triggerHaptic]
  );

  return {
    triggerTransitionFeedback,
    playTransitionSound,
    triggerHaptic,
  };
};
