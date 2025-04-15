import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, List, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const name = data?.user?.user_metadata?.name || "";
      setFullName(name);
      setFirstName(name.split(" ")[0]);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", icon: <BarChart3 size={20} />, label: "Dashboard" },
    { to: "/pipeline", icon: <List size={20} />, label: "Pipeline" },
    { to: "/leads", icon: <Users size={20} />, label: "Leads" }
  ];

  return (
    <nav className="bg-leadflow-dark-blue text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/dashboard" className="text-2xl font-bold flex items-center">
        <span className="text-leadflow-blue mr-1">CRM</span> do Tráfego
        </Link>
      </div>

      <div className="hidden md:flex space-x-6 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center space-x-1 py-2 px-3 rounded-md transition-colors ${
              location.pathname === link.to
                ? "bg-leadflow-blue bg-opacity-20 text-leadflow-blue"
                : "text-white hover:bg-white hover:bg-opacity-10"
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors">
              {/* Círculo com inicial */}
              <div className="bg-leadflow-blue text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold uppercase">
                {fullName?.charAt(0) || "U"}
              </div>
              <span>{firstName || "Conta"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-black shadow-md rounded-md">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
