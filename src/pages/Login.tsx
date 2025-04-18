import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });

    if (error) {
      toast.error("Email ou senha inválidos.");
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          name: signupData.name
        }
      }
    });

    if (error) {
      toast.error("Erro ao criar conta.");
      console.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar o acesso.");
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/update-password`
    });

    if (error) {
      toast.error("Erro ao enviar e-mail de recuperação");
    } else {
      toast.success("E-mail de recuperação enviado!");
      setShowForgotPassword(false);
      setRecoveryEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-leadflow-dark-blue mb-6">Acesse sua conta</h1>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              <Input
                placeholder="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
              <Input
                placeholder="Senha"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <p
                className="text-sm text-leadflow-blue hover:underline text-right cursor-pointer"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueceu a sua senha?
              </p>
              <Button
                className="w-full bg-leadflow-blue text-white"
                onClick={handleLogin}
                disabled={loading || !loginData.email || !loginData.password}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-4">
              <Input
                placeholder="Nome"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              />
              <Input
                placeholder="Senha"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              />
              <Button
                className="w-full bg-leadflow-blue text-white"
                onClick={handleSignup}
                disabled={loading || !signupData.name || !signupData.email || !signupData.password}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de recuperação de senha */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-4">Digite o e-mail cadastrado para receber o link de redefinição de senha.</p>
          <Input
            type="email"
            placeholder="seuemail@exemplo.com"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
          />
          <Button
            className="mt-4 w-full bg-leadflow-blue text-white"
            onClick={handlePasswordReset}
            disabled={!recoveryEmail}
          >
            Enviar link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
