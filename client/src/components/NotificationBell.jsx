import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import api from "../api/axios";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const lastSeenId = useRef(null);

  const load = async () => {
    const { data } = await api.get("/notifications");
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    const newest = data.notifications?.[0];
    if (newest && newest._id !== lastSeenId.current && !newest.isRead) {
      if (lastSeenId.current) setToast(newest);
      lastSeenId.current = newest._id;
    }
  };

  useEffect(() => {
    load().catch(() => {});
    const refresh = () => load().catch(() => {});
    const openNotifications = () => setOpen(true);
    window.addEventListener("fsams:notifications-refresh", refresh);
    window.addEventListener("fsams:open-notifications", openNotifications);
    const interval = setInterval(() => load().catch(() => {}), 15000);
    return () => {
      window.removeEventListener("fsams:notifications-refresh", refresh);
      window.removeEventListener("fsams:open-notifications", openNotifications);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    await load();
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed right-5 top-20 z-50 w-80 rounded-lg border border-emerald-900/10 bg-white p-4 shadow-glass">
          <p className="text-sm font-bold text-academic-ink">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
      )}

      <button className="relative rounded-md border border-slate-200 bg-white px-3 py-2 text-academic-ink shadow-sm transition hover:border-academic-teal/30 hover:text-academic-teal" onClick={() => setOpen((value) => !value)}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-academic-terracotta px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-glass">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-academic-ink">Notifications</p>
            <button className="text-xs font-semibold text-academic-teal" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((item) => (
              <div key={item._id} className={`border-b border-slate-100 px-4 py-3 ${item.isRead ? "bg-white" : "bg-emerald-50"}`}>
                <p className="text-sm font-semibold text-academic-ink">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600">{item.message}</p>
              </div>
            ))}
            {!notifications.length && <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
