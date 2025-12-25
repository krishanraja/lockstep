import { motion } from "framer-motion";
import { MessageSquare, Bell, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Magic link RSVPs",
    description: "No app downloads. No sign-ups. Guests respond in under 30 seconds via SMS or WhatsApp.",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Smart nudges",
    description: "Automatic reminders only go to people blocking progress. Escalation without awkwardness.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real-time clarity",
    description: "See exactly who's in, who's out, and what's unresolved—all in one calm dashboard.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Auto-resolution",
    description: "Set rules for unanswered checkpoints. No response means a decision gets made anyway.",
  },
];

const Features = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
            Built for organisers who are tired of chasing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature exists to reduce your anxiety and close open loops—nothing decorative, nothing unnecessary.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1] 
              }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-muted-foreground/30 transition-all duration-500">
    {/* Icon */}
    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-primary mb-6 transition-all duration-300 group-hover:scale-105">
      {icon}
    </div>
    
    {/* Content */}
    <h3 className="text-lg font-medium text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Features;
