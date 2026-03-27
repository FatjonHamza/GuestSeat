import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@guestseat.com' && password === 'password123') {
      onLogin();
    } else {
      setError('Email ose fjalëkalim i pavlefshëm. Ju lutem përdorni kredencialet e dhëna më poshtë.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <CardAction>
              <Button variant="link" className="px-0">Sign Up</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form id="login-form" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="admin@guestseat.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="border-red-100 bg-red-50">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" form="login-form" className="w-full group">
              <span>Login</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
            <div className="mt-2 w-full rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="mb-1 font-medium">Demo credentials</p>
              <p className="text-muted-foreground">Email: admin@guestseat.com</p>
              <p className="text-muted-foreground">Password: password123</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
