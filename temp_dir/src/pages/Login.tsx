import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";
import logoLight from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const VALID_EMAIL = "eduardocamposmachadoalv@gmail.com";
const VALID_PASSWORD = "dudu0021L";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check credentials
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // Check if account and profile exist
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*, accounts!inner(*)')
        .eq('email', email)
        .limit(1);

      if (profileError) throw profileError;

      let authUser;

      if (!profiles || profiles.length === 0) {
        // Create account and profile for first-time login
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert([{ name: 'Minha Conta', status: 'active', plan_type: 'premium' } as any])
          .select()
          .single();

        if (accountError) throw accountError;

        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .insert([{
            email: email,
            full_name: 'Eduardo Campos',
            account_id: newAccount.id
          } as any])
          .select('*, accounts!inner(*)')
          .single();

        if (newProfileError) throw newProfileError;

        authUser = {
          id: newProfile.id,
          email: newProfile.email,
          fullName: newProfile.full_name,
          userCode: newProfile.user_code,
          accountId: newProfile.account_id,
          accountCode: (newProfile.accounts as any).account_code,
        };
      } else {
        const profile = profiles[0];
        authUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          userCode: profile.user_code,
          accountId: profile.account_id,
          accountCode: (profile.accounts as any).account_code,
        };
      }

      // Save to localStorage
      localStorage.setItem('feedmetrics_auth_session', JSON.stringify(authUser));

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao FeedMetrics"
      });

      navigate("/");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 relative overflow-hidden">
      {/* Glassmorphism background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent" />
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="relative backdrop-blur-xl bg-white/95 dark:bg-white/95 rounded-3xl shadow-2xl border border-white/50 p-8">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 via-transparent to-blue-600/20 opacity-50 blur-xl -z-10" />
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logoLight} alt="FeedMetrics" className="h-20 w-auto" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bem-vindo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Faça login para acessar o FeedMetrics
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-white">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white" />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Powered by Feedmetrics Technologies</p>
          </div>
        </div>
      </div>
    </div>;
}