import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoLight from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const res = await loginWithGoogle();
      
      if (res.error) {
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível fazer o login.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

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
        <div className="relative backdrop-blur-xl bg-white/95 dark:bg-white/95 rounded-3xl shadow-2xl border border-white/50 p-8 flex flex-col justify-center items-center">
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

          <Button 
            onClick={handleGoogleLogin} 
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-lg" 
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar com Google"}
          </Button>

          {/* Info */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Powered by Feedmetrics Technologies</p>
          </div>
        </div>
      </div>
    </div>;
}