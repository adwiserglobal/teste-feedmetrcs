import { Outlet, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/login");
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          {user && (
            <span className="text-xs text-muted-foreground font-mono">
              ID da Conta: {user.accountCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  );
}
