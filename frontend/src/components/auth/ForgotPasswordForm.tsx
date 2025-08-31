import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/services/authAPI';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onSwitchToRegister: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onBackToLogin,
  onSwitchToRegister 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Form validation
  const validateForm = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  // Handle input changes
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setSuccess(true);
        
        // Log development info if available
        if (process.env.NODE_ENV === 'development' && response.resetUrl) {
          console.log('Development Reset URL:', response.resetUrl);
        }
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="shadow-lg border-green-200">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Check Your Email
            </CardTitle>
            <p className="text-muted-foreground">
              Password reset instructions sent
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
              </p>
              
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>

              {/* Development info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700 font-medium">
                    Development Mode: Check the console for the reset URL
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={onBackToLogin}
                className="w-full"
                size="lg"
              >
                Back to Sign In
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <button
                  onClick={onSwitchToRegister}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLogin}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a link to reset your password
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Server Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`pl-10 ${validationError ? 'border-destructive' : ''}`}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={onBackToLogin}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              ← Back to Sign In
            </button>
          </div>

          {/* Switch to Register */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
