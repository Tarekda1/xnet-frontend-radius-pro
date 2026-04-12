// src/socket.ts
import { io, Socket } from "socket.io-client";

import { DEFAULT_PUBLIC_API_URL } from "@/lib/publicEnv";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    console.log("🔌 Getting socket:", socket);
    if (socket && socket.connected) return socket;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : DEFAULT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
    socket = io(origin, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  
    return socket;
  };