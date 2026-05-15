import { useState } from "react";
import { Bell, Check, CheckCheck, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const notificationIcons = {
  new_feedback: "💬",
  form_response: "📝",
  new_insight: "💡",
  account: "👤",
};

const notificationColors = {
  new_feedback: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  form_response: "bg-green-500/10 text-green-500 border-green-500/20",
  new_insight: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  account: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'form_response' && notification.metadata?.form_id) {
      navigate(`/forms/${notification.metadata.form_id}/responses`);
      setOpen(false);
    } else if (notification.type === 'new_feedback') {
      navigate('/feedbacks');
      setOpen(false);
    } else if (notification.type === 'new_insight') {
      navigate('/insights-history');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-glass-hover/80"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação ainda
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl border",
                      notificationColors[notification.type]
                    )}>
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <p className="text-xs text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNotificationClick(notification)}
                          className="h-7 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}