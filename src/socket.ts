// src/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    console.log('🔌 Getting socket:', socket);
    if (socket && socket.connected) return socket;
  
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
  
    socket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  
    return socket;
  };