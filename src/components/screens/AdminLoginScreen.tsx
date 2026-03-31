import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminLoginScreenProps {
  onLogin: () => void;
}

const ADMIN_EMAIL = 'superadmin@guestseat.com';
const ADMIN_PASSWORD = 'superadmin123';

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin();
      return;
    }
    setError('Kredencialet e SuperAdmin nuk janë të sakta.');
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} />
            Hyrje SuperAdmin
          </CardTitle>
          <CardDescription>Panel i ndarë për menaxhimin e klientëve dhe aksesit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder={ADMIN_EMAIL}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Fjalëkalimi</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">Hyr në panelin SuperAdmin</Button>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Demo SuperAdmin</p>
              <p className="text-muted-foreground">Email: {ADMIN_EMAIL}</p>
              <p className="text-muted-foreground">Fjalëkalimi: {ADMIN_PASSWORD}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
