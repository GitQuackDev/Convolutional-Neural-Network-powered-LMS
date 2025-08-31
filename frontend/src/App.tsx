import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthPage, ProtectedRoute } from '@/components/auth';
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
