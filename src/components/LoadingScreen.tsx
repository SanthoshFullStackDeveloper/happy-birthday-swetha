// src/components/LoadingScreen.tsx
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
    </div>
  );
};

export default LoadingScreen;