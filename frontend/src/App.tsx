import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { AuthCard } from './components/AuthCard';
import { Layout } from './components/Layout';
import { Library } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-dark-bg text-dark-text space-y-4">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 animate-spin">
          <Library className="w-6 h-6 text-primary-light" />
        </div>
        <p className="text-sm text-dark-muted font-semibold">Initializing Grounded Environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        
        <AuthCard />
      </div>
    );
  }

  return (
    <ChatProvider>
      <Layout />
    </ChatProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
