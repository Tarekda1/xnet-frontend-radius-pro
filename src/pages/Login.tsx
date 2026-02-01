import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useLogin from '@/hooks/useLogin';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock, User } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const { login, isLoading, error } = useLogin();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem("login.rememberMe");
    if (raw === null) return;
    setRememberMe(raw === "true");
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const resp = await login(username, password);
    if (resp?.data.accessToken) {
      localStorage.setItem("login.rememberMe", String(Boolean(rememberMe)));
      authLogin(resp?.data.user, resp?.data.accessToken, rememberMe);
      let redirectPath = '/';
      const state = location.state as { from?: Location } | null;
      const fromStatePathname = state?.from?.pathname;
      const storedPath = localStorage.getItem('redirectTo');
      if (fromStatePathname && fromStatePathname !== '/login') {
        redirectPath = fromStatePathname;
      } else if (storedPath && storedPath !== '/login') {
        redirectPath = storedPath;
      }
      if (storedPath) {
        localStorage.removeItem('redirectTo');
      }
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <PageHeader
          title="Sign in"
          subtitle="Enter your credentials to access your account"
          icon={Lock}
          className="bg-white"
        />

      <Card className="w-full shadow-lg border-0">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(Boolean(v))}
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                  Remember me
                </Label>
              </div>
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            {error && (
              <Alert
                type="error"
                message={error}
              />
            )}
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4" />
      </Card>
      </div>
    </div>
  );
};

export default Login;