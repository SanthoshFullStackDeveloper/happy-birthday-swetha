// src/pages/Signup.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { signUpWithEmail } from '@/firebase';
import AuthLayout from '@/components/AuthLayout';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUpWithEmail(name, email, password);
      navigate('/');
      toast({
        title: 'Account created',
        description: 'Welcome to Daily Task Scheduler!',
      });
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" description="Get started with your task management">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your Name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          isLoading={isLoading}
        >
          Sign Up
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Signup;