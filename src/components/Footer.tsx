import lockstepLogoLight from "@/assets/lockstep-logo-light.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <img 
            src={lockstepLogoLight} 
            alt="Lockstep" 
            className="h-6 opacity-60"
          />

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              How it works
            </a>
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              Pricing
            </a>
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              Terms
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground/60">
            © 2025 Lockstep. Group decisions, resolved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
