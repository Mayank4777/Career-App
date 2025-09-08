'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ScanSearch, MessageSquare, PencilRuler } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { useSidebar } from '../ui/sidebar';

const menuItems = [
  { href: '/', label: 'Resume Builder', icon: FileText },
  { href: '/analyzer', label: 'Resume Analyzer', icon: ScanSearch },
  { href: '/interviews', label: 'Interview Prep', icon: MessageSquare },
  { href: '/editor', label: 'Resume Editor', icon: PencilRuler },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();

  const isEditorActive = pathname.startsWith('/editor');

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2.5">
          <Icons.logo className="size-7 text-primary" />
          <h1 className={cn("text-xl font-bold tracking-tight", open ? "block" : "hidden")}>CareerPilot</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            let isActive = pathname === item.href;
            if (item.href === '/editor') {
              isActive = isEditorActive;
            }

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: item.label, side: "right", align: "center" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
