import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthPage, ProtectedRoute } from '@/components/auth';
import { OAuthCallback } from '@/components/auth/OAuthCallback';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { DashboardApp } from '@/DashboardApp';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public authentication route */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* OAuth callback route */}
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* Password reset route */}
            <Route path="/auth/reset-password" element={<ResetPasswordForm />} />
            
            {/* Protected dashboard routes */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardApp />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
