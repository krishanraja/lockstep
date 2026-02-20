import { motion } from "framer-motion";
import { MessageSquare, Bell, BarChart3, Zap } from "lucide-react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/animations/Reveal";

const features = [
  {
    icon: MessageSquare,
    title: "Magic link RSVPs",
    description: "No app downloads. Guests respond in 30 seconds via SMS.",
  },
  {
    icon: Bell,
    title: "Smart nudges",
    description: "Automatic reminders only to people blocking progress.",
  },
  {
    icon: BarChart3,
    title: "Real-time clarity",
    description: "See who's in, out, and what's unresolved in one view.",
  },
  {
    icon: Zap,
    title: "Auto-resolution",
    description: "No response by deadline? Decision gets made anyway.",
  },
];

const Features = () => {
  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden px-4 md:px-8 py-6 md:py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full">
        {/* Section header */}
        <div className="text-center mb-8 md:mb-12">
          <Reveal>
            <p className="text-xs font-medium text-primary mb-2 tracking-wider uppercase">
              How it works
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-foreground mb-3">
              Built for organisers tired of chasing
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Every feature exists to reduce your anxiety and close open loops.
            </p>
          </Reveal>
        </div>

        {/* Feature grid - 2x2 */}
        <StaggerContainer className="grid grid-cols-2 gap-3 md:gap-6" staggerDelay={0.1}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div 
                className="p-4 md:p-6 rounded-xl bg-card/50 border border-border/50 h-full"
                whileHover={{ y: -2, borderColor: "hsl(var(--muted-foreground) / 0.3)" }}
                transition={{ duration: 0.2 }}
              >
                {/* Icon */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-button-bg flex items-center justify-center mb-3 md:mb-4">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-button-text" />
                </div>

                {/* Content */}
                <h3 className="font-display text-sm md:text-base font-semibold text-foreground mb-1 md:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
};

export default Features;
