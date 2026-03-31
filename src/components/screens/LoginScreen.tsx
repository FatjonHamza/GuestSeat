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
  onLogin: (credentials: { email: string; password: string; accountName: string }) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAccountName = (value: string) => {
    const [localPart = '', domainPart = ''] = value.split('@');
    const localTokens = localPart
      .split(/[._-]+/)
      .map(token => token.trim())
      .filter(Boolean);
    const domainRoot = domainPart.split('.')[0]?.trim();

    if (localTokens.length >= 2) {
      return localTokens
        .slice(0, 2)
        .map(token => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');
    }

    // Handle emails like admin@guestseat.com -> Admin Guestseat
    if (localTokens.length === 1 && domainRoot) {
      const first = localTokens[0];
      const last = domainRoot;
      return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
    }

    if (localTokens.length === 1) {
      const token = localTokens[0];
      return token.charAt(0).toUpperCase() + token.slice(1);
    }

    return 'Përdorues GuestSeat';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin({
        email: email.trim(),
        password,
        accountName: formatAccountName(email),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Kërkesa për hyrje skadoi. Kontrolloni lidhjen dhe provoni përsëri.');
      } else {
        setError(err instanceof Error ? err.message : 'Dështoi hyrja në llogari.');
      }
    } finally {
      setIsSubmitting(false);
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
            <CardTitle className="text-2xl">Hyni në llogarinë tuaj</CardTitle>
            <CardDescription>
              Shkruani emailin më poshtë për të hyrë në llogarinë tuaj
            </CardDescription>
            <CardAction>
              <Button variant="link">Regjistrohu</Button>
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
                    <Label htmlFor="password">Fjalëkalimi</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Keni harruar fjalëkalimin?
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
            <Button type="submit" form="login-form" className="w-full group" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Duke hyrë...' : 'Hyr'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="w-full">
              Hyr me Google
            </Button>
            <div className="mt-2 w-full rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="mb-1 font-medium">Përdor kredencialet e dërguara me email</p>
              <p className="text-muted-foreground">Këto kredenciale krijohen nga SuperAdmin.</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
