import { Link } from "react-router-dom";
import lockstepLogoLight from "@/assets/lockstep-logo-light.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/">
            <img
              src={lockstepLogoLight}
              alt="Lockstep"
              className="h-6 opacity-60 hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/faq" className="hover:text-foreground transition-colors duration-300">
              FAQ
            </Link>
            <Link to="/blog" className="hover:text-foreground transition-colors duration-300">
              Blog
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors duration-300">
              Pricing
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors duration-300">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors duration-300">
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground/60">
            © 2026 Lockstep. Group decisions, resolved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
