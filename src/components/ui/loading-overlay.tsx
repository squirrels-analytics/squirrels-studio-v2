import React from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const LoadingOverlay: React.FC = () => {
  const { isLoading } = useApp();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl shadow-lg border border-border animate-in fade-in zoom-in duration-200">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-foreground font-medium text-lg">Loading...</p>
      </div>
    </div>
  );
};
