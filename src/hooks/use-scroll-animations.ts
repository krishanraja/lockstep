import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

// Scroll progress for an element
export const useScrollProgress = (offset: ["start end" | "end start" | "center center", "start end" | "end start" | "center center"] = ["start end", "end start"]) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });
  
  return { ref, scrollYProgress };
};

// Parallax transform
export const useParallax = (value: MotionValue<number>, distance: number) => {
  return useTransform(value, [0, 1], [-distance, distance]);
};

// Smooth spring animation
export const useSmoothTransform = (value: MotionValue<number>, inputRange: number[], outputRange: number[]) => {
  const transform = useTransform(value, inputRange, outputRange);
  return useSpring(transform, { stiffness: 100, damping: 30 });
};

// Check if element is in view
export const useInViewProgress = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

// Mouse position relative to element
export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return mousePosition;
};

// Hover 3D tilt effect
export const useTilt = (intensity: number = 10) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;
      
      setTilt({ rotateX, rotateY });
    };

    const handleMouseLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity]);

  return { ref, tilt };
};
