import React, { useRef, useEffect } from "react";
import { Clock, ShieldCheck, Truck, AlertCircle } from "lucide-react";
import { staggerChildren } from "../../../lib/gsap";
import { useGsap } from "../../../hooks/useGsap";

export const IncidentTimeline = ({ events = [] }) => {
  const listRef = useRef(null);

  const defaultEvents = [
    {
      title: "Incident Logged",
      time: "Just now",
      desc: "Emergency coordinates confirmed by citizen.",
      icon: Clock,
    },
    {
      title: "AI Vision & Medical Triage",
      time: "1 min ago",
      desc: "Automated priority classified as HIGH.",
      icon: ShieldCheck,
    },
    {
      title: "Regional Ambulance Dispatched",
      time: "2 mins ago",
      desc: "Unit 104 assigned and navigation engaged.",
      icon: Truck,
    },
  ];

  const formattedEvents = events.map((e) => ({
    title: e.title || (e.event ? e.event.replace(/_/g, " ") : "Emergency Event"),
    time: e.createdAt
      ? new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : e.time || "Just now",
    desc: e.desc || e.metadata?.description || e.metadata?.reason || "Event recorded in audit logs",
    icon: e.icon || (e.event === "INCIDENT_CREATED" ? AlertCircle : ShieldCheck),
  }));

  const displayList = formattedEvents.length > 0 ? formattedEvents : defaultEvents;

  useGsap(() => {
    if (listRef.current) {
      staggerChildren(listRef.current, 0.08);
    }
  }, [displayList.length]);

  return (
    <div className="p-5 rounded-2xl bg-dark-900 border border-dark-700 space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span>Live Emergency Event Log</span>
      </h3>

      <div
        ref={listRef}
        className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-700"
      >
        {displayList.map((item, idx) => {
          const Icon = item.icon || Clock;
          return (
            <div key={idx} className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-dark-800 border border-cyan-400 flex items-center justify-center text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{item.title}</span>
                <span className="text-[10px] text-dark-400 font-mono">{item.time}</span>
              </div>
              <p className="text-[11px] text-dark-300 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
