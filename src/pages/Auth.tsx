import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get the return URL from query params (defaults to /dashboard)
  const returnTo = useMemo(() => {
    const param = searchParams.get('returnTo');
    // Validate it's a safe relative path
    if (param && param.startsWith('/') && !param.startsWith('//')) {
      return param;
    }
    return '/dashboard';
  }, [searchParams]);

  // Load remembered email from localStorage
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('lockstep_last_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  // Auto-focus email input
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput && !email) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }, [email]);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(returnTo);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(returnTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email for both methods
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    // Validate password only for password method
    if (authMethod === 'password') {
      if (!validateForm()) return;
    }

    setIsLoading(true);
    setShowSuccess(false);
    setErrors({});

    try {
      if (authMethod === 'magic-link') {
        // Send magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}${returnTo}`,
          },
        });
        if (error) throw error;
        
        // Remember email
        localStorage.setItem('lockstep_last_email', email);
        
        // Show success message
        setShowSuccess(true);
        setIsLoading(false);
      } else if (isLogin) {
        // Password login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Auto-detect existing user and switch to login mode
          if (error.message.includes("User already registered") || error.message.includes("Email not confirmed")) {
            setIsLogin(true);
            setErrors({ email: "This email is already registered. Please sign in instead." });
            setIsLoading(false);
            return;
          }
          throw error;
        }
        // Remember email
        localStorage.setItem('lockstep_last_email', email);
        // Navigation happens automatically via onAuthStateChange
      } else {
        // Password signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${returnTo}`,
          },
        });
        if (error) {
          // Auto-detect existing user and switch to login mode
          if (error.message.includes("User already registered")) {
            setIsLogin(true);
            setErrors({ email: "This email is already registered. Please sign in instead." });
            setIsLoading(false);
            return;
          }
          throw error;
        }
        
        // Remember email
        localStorage.setItem('lockstep_last_email', email);
        
        // Show success message for signup
        setShowSuccess(true);
        setErrors({});
      }
    } catch (error: any) {
      let message = error.message;
      if (error.message.includes("User already registered")) {
        message = "An account with this email already exists. Try signing in instead.";
        setIsLogin(true);
      } else if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      }
      
      // Set error state for inline display
      if (isLogin || authMethod === 'magic-link') {
        setErrors({ email: message });
      } else {
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-block">
            <img
              src="/lockstep-icon.png"
              alt="Lockstep"
              className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[#F5F7FA] p-2"
            />
          </button>
          <h1 className="text-2xl font-bold">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Sign in to manage your events"
              : "Start creating seamless group events"}
          </p>
        </div>

        {/* Success message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-confirmed/10 border border-confirmed/20"
          >
            <p className="text-sm text-confirmed font-medium mb-1">
              {authMethod === 'magic-link' 
                ? "Check your email!" 
                : "Account created! Check your email to verify your account."}
            </p>
            <p className="text-xs text-muted-foreground">
              {authMethod === 'magic-link'
                ? "We've sent you a magic link. Click it to sign in instantly."
                : "Click the verification link in your email to complete signup."}
            </p>
          </motion.div>
        )}

        {/* Auth method toggle */}
        <div className="mb-4 flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setErrors({});
            }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              authMethod === 'password'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('magic-link');
              setErrors({});
            }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              authMethod === 'magic-link'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Clear error when user starts typing
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={(e) => {
                // Validate on blur for better UX
                if (e.target.value && !emailSchema.safeParse(e.target.value).success) {
                  setErrors((prev) => ({ 
                    ...prev, 
                    email: "Please enter a valid email address" 
                  }));
                }
              }}
              className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 transition-all ${
                errors.email 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-border focus:ring-primary"
              }`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <motion.p 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive mt-1.5 flex items-center gap-1.5"
              >
                <span>⚠️</span>
                <span>{errors.email}</span>
              </motion.p>
            )}
          </div>

          {authMethod === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.password ? "border-destructive" : "border-border"
                }`}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          password.length < 6 
                            ? 'w-1/3 bg-destructive' 
                            : password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
                            ? 'w-2/3 bg-maybe'
                            : 'w-full bg-confirmed'
                        }`}
                      />
                    </div>
                    <span className={`text-xs ${
                      password.length < 6 
                        ? 'text-destructive' 
                        : password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
                        ? 'text-maybe'
                        : 'text-confirmed'
                    }`}>
                      {password.length < 6 
                        ? 'Weak' 
                        : password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
                        ? 'Medium'
                        : 'Strong'}
                    </span>
                  </div>
                  {password.length < 6 && (
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
                  )}
                  {password.length >= 6 && password.length < 10 && (
                    <p className="text-xs text-muted-foreground">Add more characters for better security</p>
                  )}
                  {password.length >= 6 && !/[A-Z]/.test(password) && (
                    <p className="text-xs text-muted-foreground">Add uppercase letters</p>
                  )}
                  {password.length >= 6 && !/[0-9]/.test(password) && (
                    <p className="text-xs text-muted-foreground">Add numbers</p>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading 
              ? "Loading..." 
              : authMethod === 'magic-link'
                ? "Send Magic Link"
                : isLogin 
                  ? "Sign In" 
                  : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            setErrors({});
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}${returnTo}`,
                },
              });
              if (error) throw error;
            } catch (error: any) {
              setErrors({ email: error.message || 'Failed to sign in with Google' });
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full py-3 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p className="text-center text-muted-foreground mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
