// src/hooks/useOnlineMetrics.ts
import { useState, useEffect } from 'react';
import { getSocket } from '../socket';
import { apiClient } from '../api/client';

interface OnlineMetrics {
    totalOnlineUsers: number;
    totalActiveUsers: number;
}

export const useOnlineMetrics = () => {
    const [metrics, setMetrics] = useState<OnlineMetrics>({
        totalOnlineUsers: 0,
        totalActiveUsers: 0,
    });

    useEffect(() => {
        const fetchInitialMetrics = async () => {
            try {
                const response = await apiClient.get('/online-users-metrics');
                if (response.data.success) {
                    setMetrics(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching initial online metrics:', error);
            }
        };

        fetchInitialMetrics();

        // Set up WebSocket connection
        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📊 Real-time update:', data);
                setMetrics(data);
            } catch (e) {
                console.error('Error parsing WebSocket data', e);
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
        };

        return () => {
            ws.close();
        };

        // const socket = getSocket();

        // const handleUpdate = (data: OnlineMetrics) => {
        //     console.log('📊 Received update:', data);
        //     setMetrics(data);
        // };

        // const handleConnect = () => {
        //     console.log('🔌 Connected to socket server:', socket.id);
        // };

        // socket.on('sessionStatusUpdate', handleUpdate);
        // socket.on('connect', handleConnect);

        // // Optional: catch errors
        // socket.on('connect_error', (err) => {
        //     console.error('❌ Connect error:', err.message);
        // });

        // return () => {
        //     socket.off('sessionStatusUpdate', handleUpdate);
        //     socket.off('connect', handleConnect);
        //     socket.off('connect_error');
        // };
    }, []);

    return metrics;
};
