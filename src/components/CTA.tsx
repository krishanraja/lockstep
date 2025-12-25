import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import lockstepIcon from "@/assets/lockstep-icon.png";

const CTA = () => {
  return (
    <section className="relative py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-secondary flex items-center justify-center">
          <img src={lockstepIcon} alt="" className="w-10 h-10" />
        </div>

        <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
          Stop chasing. Start closing.
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Your next group event doesn't have to be chaos. Create your first event in under 5 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" size="xl" className="group">
            Create your first event
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Pricing hint */}
        <p className="text-sm text-muted-foreground mt-8">
          Free for up to 8 guests • No credit card required
        </p>
      </motion.div>
    </section>
  );
};

export default CTA;
