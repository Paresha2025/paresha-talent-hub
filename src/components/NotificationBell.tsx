import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  entity_table: string | null;
  created_at: string;
  read_by: string[];
  actor_id: string | null;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const unread = user
    ? items.filter((n) => !n.read_by?.includes(user.id)).length
    : 0;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setItems((data as Notification[]) ?? []);
    };
    load();

    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) =>
            prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Resolve actor names for any unknown actor_ids in the current items list.
  useEffect(() => {
    const ids = Array.from(
      new Set(items.map((n) => n.actor_id).filter((id): id is string => !!id && !actors[id]))
    );
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      if (!data) return;
      setActors((prev) => {
        const next = { ...prev };
        data.forEach((p: any) => { next[p.user_id] = p.full_name ?? "Someone"; });
        return next;
      });
    })();
  }, [items, actors]);

  async function markAllRead() {
    if (!user) return;
    const unreadItems = items.filter((n) => !n.read_by?.includes(user.id));
    for (const n of unreadItems) {
      await supabase.rpc("mark_notification_read", { _id: n.id });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No notifications yet
            </p>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const isUnread = user && !n.read_by?.includes(user.id);
                return (
                  <div
                    key={n.id}
                    className={`p-3 text-sm ${isUnread ? "bg-accent/10" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-accent shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          by {n.actor_id ? (actors[n.actor_id] ?? "…") : "System"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}