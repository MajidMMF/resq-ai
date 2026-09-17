import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8010";

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected (frontend client):", socketRef.current.id);
    });

    socketRef.current.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const emit = (event, data, callback) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, callback);
    }
  };

  const on = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  return { socket: socketRef.current, emit, on, off };
};

export default useSocket;

