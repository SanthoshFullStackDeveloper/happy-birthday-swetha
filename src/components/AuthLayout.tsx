// src/components/AuthLayout.tsx
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/80 border-purple-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {title}
            </CardTitle>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-gradient-to-r from-purple-100/50 to-blue-100/50 border-purple-200 shadow-lg mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <Quote className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <blockquote className="text-sm font-medium text-gray-700 italic text-center">
                "Happy Birthday, Swetha! 🎉<br />This whole app is my little gift to my sister — organized just like mysister!"
        
              </blockquote>
              <Quote className="h-6 w-6 text-purple-600 flex-shrink-0 rotate-180" />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">– With 💖, Your Dev Brother</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;