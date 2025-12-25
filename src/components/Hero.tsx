import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import lockstepLogoLight from "@/assets/lockstep-logo-light.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mb-16"
        >
          <img 
            src={lockstepLogoLight} 
            alt="Lockstep" 
            className="h-8 md:h-10 mx-auto"
          />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.1] tracking-tight mb-8"
        >
          Group decisions,
          <br />
          <span className="text-muted-foreground">resolved.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Stop chasing people. Lockstep forces group decisions to close by deadlines—so you can stop asking and start planning.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Button variant="hero" size="xl" className="group">
            Create your first event
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <Button variant="subtle" size="xl">
            See how it works
          </Button>
        </motion.div>

        {/* Value props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          <ValueProp 
            icon={<Users className="w-5 h-5" />}
            title="Collect answers"
            description="Structured availability across multiple time blocks"
          />
          <ValueProp 
            icon={<Clock className="w-5 h-5" />}
            title="Set checkpoints"
            description="Automatic reminders to those blocking progress"
          />
          <ValueProp 
            icon={<Check className="w-5 h-5" />}
            title="Get resolution"
            description="A final, usable plan without the chasing"
          />
        </motion.div>
      </div>
    </section>
  );
};

const ValueProp = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Hero;
