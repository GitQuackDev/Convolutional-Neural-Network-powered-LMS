import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { authStorage } from '@/utils/authStorage';
import { useToast } from '@/hooks/use-toast';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth failed: ${error}`);
        }

        if (!accessToken) {
          throw new Error('No access token received from OAuth provider');
        }

        // Store tokens
        authStorage.setToken(accessToken, false);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Trigger auth context update by checking auth
        await checkAuth();

        setStatus('success');
        toast('Successfully signed in with Google!', { type: 'success' });

        // Redirect to dashboard after a brief success display
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        
        const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
        toast(errorMessage, { type: 'error' });

        // Redirect to auth page after error display
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, checkAuth, toast]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />,
          title: 'Completing Sign In',
          message: 'Finalizing your Google authentication...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Sign In Successful!',
          message: 'You have been successfully authenticated. Redirecting to dashboard...',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: 'Authentication Failed',
          message: 'There was an issue with your Google authentication. Redirecting back to sign in...',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />,
          title: 'Processing',
          message: 'Please wait...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const { icon, title, message, bgColor, borderColor } = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className={`shadow-lg border-2 ${borderColor} ${bgColor}`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {icon}
            </div>
            <CardTitle className="text-2xl font-bold">
              {title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              {message}
            </p>
            
            {status === 'loading' && (
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
