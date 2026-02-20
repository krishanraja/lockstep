import { motion } from "framer-motion";
import { useTilt } from "@/hooks/use-scroll-animations";
import { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export const TiltCard = ({ 
  children, 
  className = "", 
  intensity = 10,
  glare = true 
}: TiltCardProps) => {
  const { ref, tilt } = useTilt(intensity);

  return (
    <motion.div
      ref={ref}
      className={`relative perspective-1000 ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {children}
      {glare && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${50 + tilt.rotateY * 2}% ${50 - tilt.rotateX * 2}%, rgba(255,255,255,0.1), transparent 50%)`,
          }}
        />
      )}
    </motion.div>
  );
};

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg" | "xl";
}

export const GlassCard = ({ 
  children, 
  className = "", 
  blur = "lg" 
}: GlassCardProps) => {
  const blurMap = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  return (
    <div 
      className={`
        relative bg-card/40 border border-border/50 rounded-2xl
        ${blurMap[blur]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export const PhoneMockup = ({ children, className = "" }: PhoneMockupProps) => {
  return (
    <div className={`relative ${className}`}>
      {/* Phone frame */}
      <div className="relative bg-card rounded-[2rem] p-2 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-card rounded-b-xl z-10" />
        
        {/* Screen */}
        <div className="relative bg-background rounded-[1.5rem] overflow-hidden">
          {/* Status bar */}
          <div className="h-8 px-6 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-sm border border-muted-foreground/50" />
            </div>
          </div>
          
          {/* Content - reduced height for fitting */}
          <div className="max-h-[45vh]">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="h-6 flex items-center justify-center pb-1">
            <div className="w-24 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full -z-10" />
    </div>
  );
};

interface HeroButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const HeroButton = ({ children, className = "", onClick }: HeroButtonProps) => {
  return (
    <motion.button
      className={`
        relative px-6 py-3 md:px-8 md:py-4 bg-button-bg text-button-text font-display font-semibold
        rounded-xl overflow-hidden group
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

interface SecondaryButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SecondaryButton = ({ children, className = "", onClick }: SecondaryButtonProps) => {
  return (
    <motion.button
      className={`
        relative px-6 py-3 md:px-8 md:py-4 bg-button-bg text-button-text font-display font-medium
        rounded-xl overflow-hidden group
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
