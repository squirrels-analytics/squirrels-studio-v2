import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { useApp } from '@/context/AppContext';

const NotFoundPage: FC = () => {
  const navigate = useNavigate();
  const { hostUrl } = useApp();

  const handleBack = () => {
    if (hostUrl) {
      navigate(`/login?hostUrl=${encodeURIComponent(hostUrl)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
      </div>

      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border p-8 text-center relative z-10">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-dashed border-border animate-pulse">
          <FileQuestion className="w-12 h-12 text-muted-foreground/50" />
        </div>
        
        <h1 className="text-6xl font-black text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or you don't have permission to access it.
        </p>

        <Button 
          onClick={handleBack}
          className="w-full font-bold py-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;

