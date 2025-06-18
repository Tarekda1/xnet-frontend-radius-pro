import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useLogin from '@/hooks/useLogin';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock, User } from 'lucide-react';
import Alert from '@/components/ui/Alert';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useLogin();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const resp = await login(username, password);
    if (resp?.data.accessToken) {
      authLogin(resp?.data.user, resp?.data.accessToken);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
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
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;