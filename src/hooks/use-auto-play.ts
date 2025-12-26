import { useState, useCallback, useEffect, useRef } from "react";

interface AutoPlayOptions {
  totalSlides: number;
  intervalMs?: number;
  resumeDelayMs?: number;
  onAdvance: () => void;
}

export const useAutoPlay = ({
  totalSlides,
  intervalMs = 6000,
  resumeDelayMs = 10000,
  onAdvance,
}: AutoPlayOptions) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  // Use ref to always have access to the latest onAdvance callback
  // This prevents stale closure issues without restarting timers
  const onAdvanceRef = useRef(onAdvance);
  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAllTimers();
    startTimeRef.current = Date.now();
    setProgress(0);

    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / intervalMs) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Auto advance - use ref to get latest callback
    intervalRef.current = setTimeout(() => {
      onAdvanceRef.current();
    }, intervalMs);
  }, [intervalMs, clearAllTimers]);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearAllTimers();
    setProgress(0);
  }, [clearAllTimers]);

  const scheduleResume = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, resumeDelayMs);
  }, [resumeDelayMs]);

  const handleUserInteraction = useCallback(() => {
    pause();
    scheduleResume();
  }, [pause, scheduleResume]);

  // Start/restart auto-play when not paused
  useEffect(() => {
    if (!isPaused) {
      startAutoPlay();
    }
    return () => clearAllTimers();
  }, [isPaused, startAutoPlay, clearAllTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return {
    isPaused,
    progress,
    handleUserInteraction,
    pause,
    resume: () => setIsPaused(false),
  };
};
