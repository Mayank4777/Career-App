'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import * as React from 'react';
import { Skeleton } from "../ui/skeleton";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a skeleton loader to prevent layout shift and provide a better UX
    return (
      <div className="flex min-h-svh w-full bg-background">
        <div className="hidden md:block w-64 p-4 border-r">
          <Skeleton className="h-8 w-3/4 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="flex-1 p-8">
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
