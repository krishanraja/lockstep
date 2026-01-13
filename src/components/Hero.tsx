import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RotatingText } from "@/components/animations/KineticText";
import { Reveal, MorphingBlob } from "@/components/animations/Reveal";
import { HeroButton, PhoneMockup } from "@/components/animations/InteractiveElements";
import lockstepLogoLight from "@/assets/lockstep-logo-light.png";
import lockstepIcon from "@/assets/lockstep-icon.png";

const Hero = () => {
  const navigate = useNavigate();
  const eventTypes = ["Weddings.", "Bachelor Parties.", "Reunions.", "Trips.", "Offsites."];

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden px-4 md:px-8 py-4 md:py-6">
      {/* Background effects */}
      <div className="absolute inset-0 noise" />
      <MorphingBlob className="w-[400px] h-[400px] -top-32 -left-32 opacity-40" color="primary" />
      <MorphingBlob className="w-[300px] h-[300px] bottom-0 -right-20 opacity-20" color="primary" />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]" 
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} 
      />

      {/* Header with logo and sign-in */}
      <div className="relative z-20">
        <Reveal delay={0}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                <img src={lockstepIcon} alt="" className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <img src={lockstepLogoLight} alt="Lockstep" className="h-5 md:h-6" />
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <Link
                to="/faq"
                className="hidden md:inline-block relative z-30 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                to="/blog"
                className="hidden md:inline-block relative z-30 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/pricing"
                className="hidden md:inline-block relative z-30 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/auth"
                className="relative z-30 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-2 -mr-3"
              >
                Sign in
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        {/* Left content */}
        <div className="order-2 lg:order-1 flex flex-col justify-center">
          {/* Headline */}
          <Reveal delay={0.1}>
            <h1 className="font-display text-display-lg md:text-display-xl font-bold text-foreground leading-none">
              Group
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <div className="font-display text-display-lg md:text-display-xl font-bold text-primary leading-none my-1 md:my-2 min-h-[1.1em]">
              <RotatingText words={eventTypes} interval={2500} />
            </div>
          </Reveal>
          
          <Reveal delay={0.3}>
            <h1 className="font-display text-display-lg md:text-display-xl font-bold text-muted-foreground leading-none mb-4 md:mb-6">
              Resolved.
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={0.4}>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6 leading-relaxed">
              Stop chasing people. Lockstep forces group decisions to close by 
              deadlines—so you can stop asking and start planning.
            </p>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.5}>
            <HeroButton onClick={() => navigate('/create')}>
              Create your first event
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </HeroButton>
          </Reveal>

          {/* Trust signal */}
          <Reveal delay={0.6}>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Free for small groups • No account required
            </p>
          </Reveal>
        </div>

        {/* Right content - Phone mockup */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <Reveal delay={0.3} direction="scale">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <PhoneMockup className="w-52 md:w-64 lg:w-72">
                <MiniRSVPDemo />
              </PhoneMockup>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

// Mini RSVP demo for phone mockup
const MiniRSVPDemo = () => {
  return (
    <div className="p-3 space-y-3">
      {/* Event header */}
      <div className="text-center py-2">
        <p className="text-[10px] text-muted-foreground mb-0.5">You're invited to</p>
        <h3 className="font-display text-sm font-semibold">Sarah's Birthday</h3>
        <p className="text-[10px] text-muted-foreground">Jun 15-17 • Lake Tahoe</p>
      </div>

      {/* Time blocks */}
      <div className="space-y-1.5">
        {[
          { name: "Friday Evening", status: "confirmed" },
          { name: "Saturday Day", status: "maybe" },
          { name: "Saturday Night", status: "confirmed" },
        ].map((block, i) => (
          <motion.div
            key={block.name}
            className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <span className="text-xs">{block.name}</span>
            <div className="flex gap-0.5">
              {["confirmed", "maybe", "out"].map((status) => (
                <div
                  key={status}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${
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
        className="w-full py-2 bg-button-bg text-button-text rounded-lg text-xs font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Submit Response
      </motion.button>
    </div>
  );
};

export default Hero;
