import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { Mail, Chrome, Shield, Loader2 } from 'lucide-react';
import type { User, LoginInput } from '../../../server/src/schema';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  isDarkMode: boolean;
}

export function LoginModal({ isOpen, onClose, onLogin, isDarkMode }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loginData: LoginInput = {
        email: email.trim(),
        provider: 'email'
      };
      
      const user = await trpc.loginUser.mutate(loginData);
      if (user) {
        onLogin(user);
      } else {
        setError('Login gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real app, this would integrate with Google OAuth
      // For now, we'll simulate a Google login
      const mockEmail = 'user@gmail.com';
      const loginData: LoginInput = {
        email: mockEmail,
        provider: 'google',
        provider_token: 'mock-google-token'
      };
      
      const user = await trpc.loginUser.mutate(loginData);
      if (user) {
        onLogin(user);
      } else {
        setError('Login Google gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Terjadi kesalahan saat login dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Masuk ke JalanMa
          </DialogTitle>
          <DialogDescription>
            Masuk untuk melaporkan kerusakan jalan dan membantu memperbaiki infrastruktur kota
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Login dengan Email
                </CardTitle>
                <CardDescription>
                  Masukkan email Anda untuk masuk ke aplikasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Masuk'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Chrome className="h-4 w-4" />
                  Login dengan Google
                </CardTitle>
                <CardDescription>
                  Gunakan akun Google Anda untuk masuk dengan cepat dan aman
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={handleGoogleLogin} 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-2 h-4 w-4" />
                      Lanjutkan dengan Google
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          Dengan masuk, Anda menyetujui syarat dan ketentuan penggunaan aplikasi JalanMa
        </div>
      </DialogContent>
    </Dialog>
  );
}