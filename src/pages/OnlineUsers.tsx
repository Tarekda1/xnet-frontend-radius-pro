// OnlineUsersPage.tsx (or wherever you host the page)
import { useState, useCallback, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import OnlineUsersTable from "../components/OnlineUsersTable";
import { RefreshCw, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { websocketService } from "@/services/websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { MESSAGES } from "@/constants/messages";

export default function OnlineUsersPage() {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      notify.success(MESSAGES.onlineUsers.refreshedTitle, MESSAGES.onlineUsers.refreshedDescription);
    }, 1000);
  }, []);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Subscribe to WebSocket notifications
    const unsubscribe = websocketService.onNotification((data) => {
      if (data.type === 'USER_STATUS_CHANGE') {
        notify.success(MESSAGES.onlineUsers.statusUpdatedTitle, `${data.username} is now ${data.status}`);
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
  }, [handleRefresh]);

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
      <PageHeader
        title="Online Users"
        subtitle="Monitor and manage active user sessions"
        icon={Users}
        actions={(
          <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        )}
      />

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
