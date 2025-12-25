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
      <div className="relative bg-card rounded-[3rem] p-3 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-card rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="relative bg-background rounded-[2.5rem] overflow-hidden">
          {/* Status bar */}
          <div className="h-12 px-8 flex items-center justify-between text-xs text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-sm border border-muted-foreground/50" />
            </div>
          </div>
          
          {/* Content */}
          <div className="min-h-[500px]">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="h-8 flex items-center justify-center pb-2">
            <div className="w-32 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute -inset-10 bg-primary/10 blur-3xl rounded-full -z-10" />
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
        relative px-8 py-4 bg-primary text-primary-foreground font-display font-semibold
        rounded-xl overflow-hidden group
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-primary-glow blur-xl opacity-50" />
      </div>
      
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
        relative px-8 py-4 bg-transparent border border-border text-foreground font-display font-medium
        rounded-xl overflow-hidden group
        hover:border-muted-foreground/50 transition-colors duration-300
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
