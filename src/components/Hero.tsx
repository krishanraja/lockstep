import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
import { RotatingText } from "@/components/animations/KineticText";
import { Reveal, MorphingBlob, Floating } from "@/components/animations/Reveal";
import { HeroButton, SecondaryButton, PhoneMockup } from "@/components/animations/InteractiveElements";
import lockstepLogoLight from "@/assets/lockstep-logo-light.png";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const eventTypes = ["Weddings.", "Bachelor Parties.", "Family Reunions.", "Group Trips.", "Team Offsites."];

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden px-6 py-20 md:py-32"
    >
      {/* Background effects */}
      <div className="absolute inset-0 noise" />
      
      {/* Morphing gradient orbs */}
      <MorphingBlob className="w-[600px] h-[600px] -top-40 -left-40" color="primary" />
      <MorphingBlob className="w-[400px] h-[400px] top-1/2 -right-20 opacity-20" color="primary" />
      
      {/* Grid overlay - very subtle */}
      <div 
        className="absolute inset-0 opacity-[0.015]" 
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} 
      />

      <motion.div 
        className="relative z-10 max-w-7xl mx-auto w-full"
        style={{ y, opacity, scale }}
      >
        {/* Logo */}
        <Reveal delay={0}>
          <motion.img 
            src={lockstepLogoLight} 
            alt="Lockstep" 
            className="h-6 md:h-8 mb-12 md:mb-20"
          />
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="order-2 lg:order-1">
            {/* Main headline */}
            <Reveal delay={0.1}>
              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-foreground mb-4">
                Group
              </h1>
            </Reveal>
            
            <Reveal delay={0.2}>
              <div className="font-display text-display-lg md:text-display-xl font-bold text-primary mb-4 min-h-[1.2em]">
                <RotatingText words={eventTypes} interval={2500} />
              </div>
            </Reveal>
            
            <Reveal delay={0.3}>
              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-muted-foreground mb-8">
                Resolved.
              </h1>
            </Reveal>

            {/* Subheadline */}
            <Reveal delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
                Stop chasing people. Lockstep forces group decisions to close by 
                deadlines—so you can stop asking and start planning.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4">
                <HeroButton>
                  Create your first event
                  <ArrowRight className="w-5 h-5" />
                </HeroButton>
                <SecondaryButton>
                  <Play className="w-4 h-4" />
                  See how it works
                </SecondaryButton>
              </div>
            </Reveal>

            {/* Trust signal */}
            <Reveal delay={0.6}>
              <p className="mt-10 text-sm text-muted-foreground/60">
                No account required to start • Free for small groups
              </p>
            </Reveal>
          </div>

          {/* Right content - Phone mockup */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <Reveal delay={0.3} direction="scale">
              <Floating duration={8} distance={15}>
                <PhoneMockup className="w-72 md:w-80">
                  <MiniRSVPDemo />
                </PhoneMockup>
              </Floating>
            </Reveal>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div 
            className="w-1 h-2 bg-muted-foreground/50 rounded-full"
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

// Mini RSVP demo for phone mockup
const MiniRSVPDemo = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Event header */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">You're invited to</p>
        <h3 className="font-display text-lg font-semibold">Sarah's Birthday</h3>
        <p className="text-xs text-muted-foreground">Jun 15-17 • Lake Tahoe</p>
      </div>

      {/* Time blocks */}
      <div className="space-y-2">
        {[
          { name: "Friday Evening", status: "confirmed" },
          { name: "Saturday Day", status: "maybe" },
          { name: "Saturday Night", status: "confirmed" },
          { name: "Sunday AM", status: null },
        ].map((block, i) => (
          <motion.div
            key={block.name}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <span className="text-sm">{block.name}</span>
            <div className="flex gap-1">
              {["confirmed", "maybe", "out"].map((status) => (
                <div
                  key={status}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                    block.status === status
                      ? status === "confirmed"
                        ? "bg-confirmed text-background"
                        : status === "maybe"
                        ? "bg-maybe text-background"
                        : "bg-out text-background"
                      : "bg-muted/50"
                  }`}
                >
                  {status === "confirmed" ? "✓" : status === "maybe" ? "?" : "✗"}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submit button */}
      <motion.button
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Submit Response
      </motion.button>
    </div>
  );
};

export default Hero;
