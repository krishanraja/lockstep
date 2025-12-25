import { useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipe, useKeyboardNavigation } from "@/hooks/use-swipe";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideControllerProps {
  children: ReactNode[];
}

const SlideController = ({ children }: SlideControllerProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalSlides = children.length;

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= totalSlides) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide, totalSlides]);

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useKeyboardNavigation(goPrev, goNext);

  // Touch swipe
  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
    threshold: 50,
  });

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div 
      className="relative h-[100dvh] w-full overflow-hidden bg-background"
      {...swipeHandlers}
    >
      {/* Slide content */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
          }}
          className="absolute inset-0"
        >
          {children[currentSlide]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows - desktop only */}
      <div className="hidden md:flex absolute inset-y-0 left-4 items-center z-20">
        <motion.button
          onClick={goPrev}
          className={`p-3 rounded-full bg-button-bg text-button-text transition-opacity ${
            currentSlide === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:opacity-80"
          }`}
          whileHover={currentSlide > 0 ? { scale: 1.1 } : {}}
          whileTap={currentSlide > 0 ? { scale: 0.95 } : {}}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 right-4 items-center z-20">
        <motion.button
          onClick={goNext}
          className={`p-3 rounded-full bg-button-bg text-button-text transition-opacity ${
            currentSlide === totalSlides - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:opacity-80"
          }`}
          whileHover={currentSlide < totalSlides - 1 ? { scale: 1.1 } : {}}
          whileTap={currentSlide < totalSlides - 1 ? { scale: 0.95 } : {}}
          disabled={currentSlide === totalSlides - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? "w-8 h-2 bg-button-bg" 
                : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Swipe hint - mobile only, first slide only */}
      {currentSlide === 0 && (
        <motion.div
          className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span>Swipe to explore</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

export default SlideController;
