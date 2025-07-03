// src/pages/Signup.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { signUpWithEmail } from '@/firebase';
import AuthLayout from '@/components/AuthLayout';
import { motion } from 'framer-motion';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.endsWith('@swetha.com') && !email.endsWith('@birthday.com')) {
      toast({
        title: 'Invalid Email',
        description: 'Please use my sister domain @swetha.com email address.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

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
      {/* Optional background blob (remove if already in AuthLayout) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-20 animate-pulse -translate-x-1/2" />
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your Name"
            className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Password Input */}
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
            className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            isLoading={isLoading}
          >
            Sign Up
          </Button>
        </motion.div>

        {/* Login Link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline transition-colors duration-200">
            Log in
          </Link>
        </div>
      </motion.form>
    </AuthLayout>
  );
};

export default Signup;
