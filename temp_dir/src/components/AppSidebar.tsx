import { BarChart3, Star, FileText, Settings, UserCog } from "lucide-react";
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
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
