import { BarChart3, Star, FileText, Settings, UserCog, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import logoLight from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import { useEffect, useState } from "react";

const items = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Feedbacks", url: "/feedbacks", icon: Star },
  { title: "Formulários", url: "/forms", icon: FileText },
  { title: "Form Builder", url: "/form-builder", icon: Settings },
  { title: "Market Data Studio", url: "/market-data", icon: TrendingUp },
  { title: "Configurações", url: "/settings", icon: UserCog },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center justify-center py-6">
          <img 
            src={isDark ? logoDark : logoLight} 
            alt="FeedMetrics" 
            className={open ? "h-10 w-auto transition-all" : "h-8 w-auto transition-all"}
          />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold px-4 mb-2">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end
                    className="w-full block"
                  >
                    {({ isActive }) => (
                      <SidebarMenuButton 
                        tooltip={item.title} 
                        isActive={isActive}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "!bg-primary !text-primary-foreground shadow-md font-bold scale-[1.02]" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "!text-primary-foreground" : "text-sidebar-foreground/70"}`} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
