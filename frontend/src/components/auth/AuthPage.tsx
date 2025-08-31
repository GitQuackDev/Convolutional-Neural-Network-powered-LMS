import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, GraduationCap } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => setAuthMode('register');
  const handleSwitchToLogin = () => setAuthMode('login');
  const handleForgotPassword = () => setAuthMode('forgot-password');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary" />
              <GraduationCap className="w-4 h-4 text-primary absolute -top-1 -right-1" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">LMS CNN</h1>
            <p className="text-sm text-muted-foreground">
              Intelligent Learning Management System
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {authMode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm
                  onSwitchToRegister={handleSwitchToRegister}
                  onForgotPassword={handleForgotPassword}
                />
              </motion.div>
            )}

            {authMode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
              </motion.div>
            )}

            {authMode === 'forgot-password' && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ForgotPasswordForm
                  onBackToLogin={handleSwitchToLogin}
                  onSwitchToRegister={handleSwitchToRegister}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-muted-foreground">
        <p>
          Powered by CNN technology for intelligent content analysis
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a href="/about" className="hover:text-foreground transition-colors">
            About
          </a>
          <span>•</span>
          <a href="/help" className="hover:text-foreground transition-colors">
            Help
          </a>
          <span>•</span>
          <a href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
};
