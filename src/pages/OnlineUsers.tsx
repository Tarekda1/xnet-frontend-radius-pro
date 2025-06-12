// OnlineUsersPage.tsx (or wherever you host the page)
import React, { useState, useCallback, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import OnlineUsersTable from "../components/OnlineUsersTable";
import { RefreshCw, Users, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { websocketService } from "@/services/websocket";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnlineUsersPage() {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const { toast } = useToast();

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Users refreshed",
        description: "The online users list has been updated.",
      });
    }, 1000);
  }, [toast]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Subscribe to WebSocket notifications
    const unsubscribe = websocketService.onNotification((data) => {
      if (data.type === 'USER_STATUS_CHANGE') {
        toast({
          title: "User status updated",
          description: `${data.username} is now ${data.status}`,
        });
        handleRefresh();
      }
    });

    // Initial connection
    websocketService.connect();

    return () => {
      clearTimeout(timer);
      unsubscribe();
      websocketService.disconnect();
    };
  }, [toast, handleRefresh]);

  if (isLoading) {
    return (
      <div className="w-full py-6 space-y-6">
        <header className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24 ml-2" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-24" />
          </div>
        </header>

        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <Skeleton className="h-10 w-full lg:max-w-xl" />
            <div className="flex items-center gap-4 lg:border-l lg:border-border lg:pl-4">
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-16 w-32" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-none">
          <CardContent className="px-0">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full py-6 space-y-6">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Online Users</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage active user sessions
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* Dashboard Controls Card */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex-1 min-w-0 lg:max-w-xl">
            <SearchBar 
              currentSearchTerm={search} 
              onSearch={handleSearch}
              placeholder="Search by username, status, or profile..."
              className="w-full"
            />
          </div>

          {/* Metrics Section */}
          <div className="flex items-center gap-6 lg:border-l lg:border-border lg:pl-6">
            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-lg font-semibold text-blue-600">{onlineCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Idle</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-lg font-semibold text-yellow-600">0</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Disconnected</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-lg font-semibold text-red-600">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Last Updated</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <OnlineUsersTable 
        search={search} 
        onCountChange={setOnlineCount}
        isRefreshing={isRefreshing}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
