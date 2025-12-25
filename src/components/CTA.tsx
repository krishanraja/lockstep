import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal, MorphingBlob } from "@/components/animations/Reveal";
import { HeroButton } from "@/components/animations/InteractiveElements";
import lockstepIcon from "@/assets/lockstep-icon.png";

const CTA = () => {
  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden px-4 md:px-8 py-6 md:py-10">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <MorphingBlob className="w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" color="primary" />
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        {/* Icon with light background */}
        <Reveal>
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-6 md:mb-8"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <img src={lockstepIcon} alt="" className="w-10 h-10 md:w-12 md:h-12" />
          </motion.div>
        </Reveal>

        {/* Badge */}
        <Reveal delay={0.1}>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-button-bg text-button-text text-xs font-medium mb-4 md:mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-confirmed animate-pulse" />
            Free for small groups
          </motion.div>
        </Reveal>

        {/* Headline */}
        <Reveal delay={0.2}>
          <h2 className="font-display text-display-md md:text-display-lg font-bold text-foreground mb-2 md:mb-3">
            Stop chasing.
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <h2 className="font-display text-display-md md:text-display-lg font-bold text-muted-foreground mb-4 md:mb-6">
            Start closing.
          </h2>
        </Reveal>

        {/* Subheadline */}
        <Reveal delay={0.4}>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6 md:mb-8">
            Your next group event deserves better than "still waiting on a few people."
          </p>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.5}>
          <HeroButton>
            Create your first event
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </HeroButton>
        </Reveal>

        {/* Social proof */}
        <Reveal delay={0.6}>
          <div className="mt-8 md:mt-10 pt-6 border-t border-border/30 w-full">
            <p className="text-[10px] text-muted-foreground/60 mb-3">
              Trusted for
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/40">
              {["Weddings", "Bachelor Parties", "Reunions", "Group Trips", "Offsites"].map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default CTA;
