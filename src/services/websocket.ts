import { Client, Message } from '@stomp/stompjs';
import { toast } from '@/components/ui/use-toast';

class WebSocketService {
    private client: Client | null = null;
    private isConnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 5000; // 5 seconds
    private reconnectTimer: NodeJS.Timeout | null = null;
    private subscribers: Map<string, ((data: any) => void)[]> = new Map();

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        if (this.client) {
            return;
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:15674'}/ws`;
        console.log('Initializing WebSocket client with URL:', wsUrl);

        this.client = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
                login: 'guest',
                passcode: 'guest',
            },
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = () => {
            console.log('STOMP: Connected successfully');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.subscribeToTopics();
        };

        this.client.onStompError = (frame) => {
            console.error('STOMP: Error', frame);
            this.handleConnectionError();
        };

        this.client.onWebSocketError = (event) => {
            console.error('STOMP: WebSocket Error', event);
            this.handleConnectionError();
        };

        this.client.onWebSocketClose = () => {
            console.log('STOMP: Connection closed');
            this.handleConnectionError();
        };
    }

    private handleConnectionError() {
        this.isConnecting = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`STOMP: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }

            this.reconnectTimer = setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
        } else {
            console.error('STOMP: Max reconnection attempts reached');
            toast({
                title: "Connection Error",
                description: "Unable to establish WebSocket connection. Please refresh the page.",
                variant: "destructive",
            });
        }
    }

    private subscribeToTopics() {
        if (!this.client?.connected) {
            console.error('Cannot subscribe: WebSocket client is not connected');
            return;
        }

        console.log('Subscribing to topics...');

        try {
            // Subscribe to invoice modifications
            this.client.subscribe('/queue/user_actions_queue', (message: Message) => {
                try {
                    console.log('Received message on /queue/user_actions_queue:', message.body);
                    const data = JSON.parse(message.body);
                    console.log('Parsed message data:', data);
                    this.notifySubscribers('INVOICE_MODIFICATION', data);
                    this.notifySubscribers('EXTERNAL_INVOICE_PAID', data);
                    
                    // Show toast notification
                    toast({
                        title: data.title,
                        description: data.message,
                    });
                } catch (error) {
                    console.error('STOMP: Error parsing message', error);
                }
            });

            // Subscribe to user status changes
            this.client.subscribe('/topic/user-status', (message: Message) => {
                try {
                    console.log('Received message on /topic/user-status:', message.body);
                    const data = JSON.parse(message.body);
                    this.notifySubscribers('USER_STATUS_CHANGE', data);
                } catch (error) {
                    console.error('STOMP: Error parsing message', error);
                }
            });

            console.log('Successfully subscribed to all topics');
        } catch (error) {
            console.error('Error subscribing to topics:', error);
        }
    }

    public connect() {
        if (this.isConnecting || (this.client?.connected)) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        console.log('Connecting to WebSocket...');
        this.isConnecting = true;
        this.initializeClient();

        try {
            this.client?.activate();
        } catch (error) {
            console.error('STOMP: Connection error', error);
            this.handleConnectionError();
        }
    }

    public disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.client?.connected) {
            this.client.deactivate();
        }
        
        this.client = null;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

    public onNotification(callback: (data: any) => void, topic: string = 'INVOICE_MODIFICATION') {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic)?.push(callback);

        return () => {
            const callbacks = this.subscribers.get(topic);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    private notifySubscribers(topic: string, data: any) {
        const callbacks = this.subscribers.get(topic);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
}

export const websocketService = new WebSocketService(); 