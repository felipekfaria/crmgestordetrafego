import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/common/Navbar";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-leadflow-light-gray">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4 max-w-lg">
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="text-lg font-medium">{user?.user_metadata?.name || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">E-mail</p>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>

          <div className="pt-4">
            <Button variant="destructive" onClick={handleLogout}>
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
