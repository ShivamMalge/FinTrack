'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center bg-gray-50 dark:bg-gray-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Authentication Error</h2>
        <p className="text-muted-foreground max-w-md">
          Something went wrong loading the authentication page.
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
