// PhoneVerification - Phone number input with OTP verification
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneVerificationProps {
  userId: string;
  currentPhone: string | null;
  isVerified: boolean;
  onPhoneChange: (phone: string, verified: boolean) => void;
}

type VerificationStep = 'input' | 'verify' | 'success';

// Country codes for dropdown
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
];

export const PhoneVerification = ({
  userId,
  currentPhone,
  isVerified,
  onPhoneChange,
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<VerificationStep>('input');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Parse existing phone into country code and number
  useEffect(() => {
    if (currentPhone) {
      const matchedCode = COUNTRY_CODES.find(c => currentPhone.startsWith(c.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setPhoneNumber(currentPhone.slice(matchedCode.code.length));
      } else {
        setPhoneNumber(currentPhone);
      }
    }
  }, [currentPhone]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    return value.replace(/\D/g, '');
  };

  const handleSendOTP = async () => {
    const cleanNumber = formatPhoneNumber(phoneNumber);
    if (cleanNumber.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }

    const fullPhone = `${countryCode}${cleanNumber}`;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
        body: { phone: fullPhone },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setStep('verify');
      setCooldown(60); // 60 second cooldown for resend
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    const cleanNumber = formatPhoneNumber(phoneNumber);
    const fullPhone = `${countryCode}${cleanNumber}`;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-otp', {
        body: { phone: fullPhone, otp },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Update profile with verified phone
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: fullPhone,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setStep('success');
      onPhoneChange(fullPhone, true);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    handleSendOTP();
  };

  const handleChangeNumber = () => {
    setStep('input');
    setOtp('');
    setError(null);
  };

  if (isVerified && currentPhone && step !== 'success') {
    // Show verified state
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-confirmed/10 border border-confirmed/20">
          <div className="w-10 h-10 rounded-full bg-confirmed/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-confirmed" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{currentPhone}</p>
            <p className="text-xs text-confirmed">Phone verified</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('input')}
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Phone Number
            </div>

            <div className="flex gap-2">
              {/* Country code selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg bg-background border border-border
                  text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {/* Phone number input */}
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="Phone number"
                className="flex-1 bg-background"
              />
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={isLoading || phoneNumber.length < 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Phone
                </>
              )}
            </Button>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Enter the 6-digit code sent to
              </p>
              <p className="font-medium text-foreground">
                {countryCode}{phoneNumber}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  setError(null);
                  // Auto-submit when 6 digits entered
                  if (value.length === 6 && !isLoading) {
                    handleVerifyOTP();
                  }
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={handleChangeNumber}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Change number
              </button>
              <button
                onClick={handleResendOTP}
                disabled={cooldown > 0 || isLoading}
                className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="w-16 h-16 rounded-full bg-confirmed/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-confirmed" />
            </div>
            <p className="text-lg font-medium text-foreground">Phone Verified!</p>
            <p className="text-sm text-muted-foreground">
              {countryCode}{phoneNumber}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

export default PhoneVerification;
