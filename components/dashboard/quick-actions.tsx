"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, HelpCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Plus,
      label: "New Project",
      description: "Start validating a new idea",
      variant: "default" as const,
      onClick: () => router.push("/create-project"),
    },
    {
      icon: Play,
      label: "Continue Coaching",
      description: "Resume your session",
      variant: "secondary" as const,
      onClick: () => router.push("/coach"),
    },
    {
      icon: HelpCircle,
      label: "Take Quiz",
      description: "Answer more questions",
      variant: "secondary" as const,
      onClick: () => router.push("/questions"),
    },
    {
      icon: FileText,
      label: "View Documents",
      description: "Review your work",
      variant: "secondary" as const,
      onClick: () => router.push("/documents"),
    },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.label}
            className="border-0 shadow-md card-hover cursor-pointer group"
            onClick={action.onClick}
          >
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light group-hover:bg-primary transition-colors">
                <action.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold mb-1">{action.label}</h4>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
