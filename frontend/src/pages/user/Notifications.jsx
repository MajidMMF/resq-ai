import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "../../features/notifications/notificationsApi";
import PageHeader from "../../components/shared/PageHeader";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import { Bell, CheckCheck, Trash2, AlertTriangle, Truck, Building2, Info } from "lucide-react";
import { toast } from "sonner";

export const Notifications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");

  const { data: notifData, isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notifData?.data || [];

  const filtered = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "EMERGENCY") return n.type?.includes("incident") || n.type?.includes("ai");
    if (activeTab === "AMBULANCE") return n.type?.includes("ambulance");
    if (activeTab === "SYSTEM") return n.type?.includes("admin") || n.type?.includes("system");
    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read");
      refetch();
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.read) {
      markAsRead(item._id);
    }
    if (item.data?.incidentId) {
      navigate(`/emergency/${item.data.incidentId}`);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      toast.info("Notification removed");
      refetch();
    } catch (e) {
      toast.error("Failed to delete notification");
    }
  };

  const getIcon = (type = "") => {
    if (type.includes("ambulance")) return <Truck className="w-4 h-4 text-cyan-400" />;
    if (type.includes("hospital")) return <Building2 className="w-4 h-4 text-emergency-500" />;
    if (type.includes("incident") || type.includes("alert"))
      return <AlertTriangle className="w-4 h-4 text-warning-400" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Real-time alerts, ambulance progress, and emergency notifications."
        action={
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-xs font-semibold text-slate-200 transition"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>Mark All Read</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-dark-700 pb-2">
        {["ALL", "EMERGENCY", "AMBULANCE", "SYSTEM"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-dark-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts right now"
          description="You're all caught up! Real-time notifications will appear here during active emergencies."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item._id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                item.read
                  ? "bg-dark-900/60 border-dark-800/80 hover:bg-dark-800/70"
                  : "bg-dark-800 border-cyan-500/30 shadow-md shadow-cyan-950/20"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>
                  <p className="text-xs text-dark-300 mt-1 leading-relaxed">{item.body}</p>
                  <p className="text-[10px] text-dark-500 font-mono mt-2">
                    {new Date(item.createdAt).toLocaleTimeString()} •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(e, item._id)}
                className="p-1.5 rounded-lg text-dark-500 hover:text-emergency-400 transition shrink-0"
                title="Delete alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

