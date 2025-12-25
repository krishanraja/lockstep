import { motion } from "framer-motion";
import { AlertCircle, Check, Clock, TrendingUp } from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
            See what matters, not everything
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The dashboard shows only what's blocking your plan. No vanity metrics, no noise—just decisions.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
        >
          {/* Dashboard header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tom's Bucks Weekend</h3>
              <p className="text-sm text-muted-foreground">14 days until event • Checkpoint 2 active</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-confirmed/15 text-confirmed">
                16 confirmed
              </span>
              <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-maybe/15 text-maybe">
                3 pending
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
            <StatCard icon={<Check className="w-4 h-4" />} value="16" label="Confirmed" color="confirmed" />
            <StatCard icon={<Clock className="w-4 h-4" />} value="3" label="Pending" color="maybe" />
            <StatCard icon={<AlertCircle className="w-4 h-4" />} value="1" label="Blocking" color="out" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} value="84%" label="Response rate" color="primary" />
          </div>

          {/* Open loops */}
          <div className="p-6">
            <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-maybe" />
              Open loops requiring attention
            </h4>
            
            <div className="space-y-3">
              <OpenLoopRow 
                name="Sarah M."
                issue="No response to dietary requirements"
                checkpoint="Checkpoint 2"
                action="Send nudge"
              />
              <OpenLoopRow 
                name="James K."
                issue="Saturday dinner marked as 'Maybe'"
                checkpoint="Blocking headcount"
                action="Request decision"
              />
              <OpenLoopRow 
                name="Alex P."
                issue="Arrival time not confirmed"
                checkpoint="Transport planning"
                action="Send reminder"
              />
            </div>
          </div>

          {/* Heatmap preview */}
          <div className="px-6 pb-6">
            <h4 className="text-sm font-medium text-foreground mb-4">Attendance by time block</h4>
            <div className="grid grid-cols-5 gap-2">
              {["Fri Night", "Sat Day", "Sat Dinner", "Sat Night", "Sun Brunch"].map((block, i) => (
                <div key={block} className="text-center">
                  <div 
                    className={`h-12 rounded-lg mb-2 flex items-center justify-center text-sm font-medium ${
                      i === 4 
                        ? "bg-maybe/20 text-maybe" 
                        : "bg-confirmed/20 text-confirmed"
                    }`}
                  >
                    {i === 4 ? "12" : "16"}
                  </div>
                  <p className="text-xs text-muted-foreground">{block}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
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
    <div className="p-5 border-r border-border last:border-r-0">
      <div className={`flex items-center gap-2 mb-1 ${colorClasses[color]}`}>
        {icon}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

const OpenLoopRow = ({ 
  name, 
  issue, 
  checkpoint, 
  action 
}: { 
  name: string; 
  issue: string; 
  checkpoint: string; 
  action: string;
}) => (
  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{issue}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">{checkpoint}</p>
    </div>
    <button className="px-4 py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors duration-300">
      {action}
    </button>
  </div>
);

export default DashboardPreview;
