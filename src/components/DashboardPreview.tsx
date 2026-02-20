import { motion } from "framer-motion";
import { AlertCircle, Check, Clock, TrendingUp } from "lucide-react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/animations/Reveal";
import { GlassCard } from "@/components/animations/InteractiveElements";

const DashboardPreview = () => {
  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden px-4 md:px-8 py-6 md:py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {/* Section header */}
        <div className="text-center mb-6 md:mb-8">
          <Reveal>
            <p className="text-xs font-medium text-primary mb-2 tracking-wider uppercase">
              Organiser Dashboard
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-foreground mb-2">
              See what's blocking progress
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-sm text-muted-foreground">
              Real-time visibility. One-tap nudges. No spreadsheets.
            </p>
          </Reveal>
        </div>

        {/* Dashboard mockup */}
        <Reveal delay={0.3} direction="scale">
          <GlassCard className="overflow-hidden">
            {/* Dashboard header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base md:text-lg font-semibold text-foreground">Tom's Bucks Weekend</h3>
                <p className="text-xs text-muted-foreground">14 days until event</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-confirmed/15 text-confirmed">
                  16 confirmed
                </span>
                <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-maybe/15 text-maybe">
                  3 pending
                </span>
              </div>
            </div>

            {/* Stats row */}
            <StaggerContainer className="grid grid-cols-4 border-b border-border/50" staggerDelay={0.05}>
              <StaggerItem>
                <StatCard icon={<Check className="w-3.5 h-3.5" />} value="16" label="Confirmed" color="confirmed" />
              </StaggerItem>
              <StaggerItem>
                <StatCard icon={<Clock className="w-3.5 h-3.5" />} value="3" label="Pending" color="maybe" />
              </StaggerItem>
              <StaggerItem>
                <StatCard icon={<AlertCircle className="w-3.5 h-3.5" />} value="1" label="Blocking" color="out" />
              </StaggerItem>
              <StaggerItem>
                <StatCard icon={<TrendingUp className="w-3.5 h-3.5" />} value="84%" label="Response" color="primary" />
              </StaggerItem>
            </StaggerContainer>

            {/* Open loops */}
            <div className="p-4 md:p-6">
              <h4 className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-maybe" />
                Open loops
              </h4>
              
              <div className="space-y-2">
                <OpenLoopRow 
                  name="Sarah M."
                  issue="No dietary response"
                  action="Nudge"
                />
                <OpenLoopRow 
                  name="James K."
                  issue="Saturday = Maybe"
                  action="Request"
                />
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
};

const StatCard = ({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string; 
  color: string;
}) => {
  const colorClasses: Record<string, string> = {
    confirmed: "text-confirmed",
    maybe: "text-maybe",
    out: "text-out",
    primary: "text-primary",
  };

  return (
    <div className="p-3 md:p-4 border-r border-border/50 last:border-r-0">
      <div className={`flex items-center gap-1.5 mb-0.5 ${colorClasses[color]}`}>
        {icon}
        <span className="text-lg md:text-xl font-semibold">{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
};

const OpenLoopRow = ({ 
  name, 
  issue, 
  action 
}: { 
  name: string; 
  issue: string; 
  action: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-[10px] text-muted-foreground">{issue}</p>
    </div>
    <button className="px-3 py-1.5 text-[10px] font-medium bg-button-bg text-button-text rounded-lg">
      {action}
    </button>
  </div>
);

export default DashboardPreview;
