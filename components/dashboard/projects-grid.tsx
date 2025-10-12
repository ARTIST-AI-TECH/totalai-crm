"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  emoji: string;
  phase: number;
  progress: number;
  status: "active" | "paused" | "completed";
  lastUpdated: string;
}

interface ProjectsGridProps {
  projects: Project[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-white";
      case "paused":
        return "bg-warning text-foreground";
      case "completed":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">My Projects</h3>
        <span className="text-sm text-muted-foreground">{projects.length} projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className={cn(
              "border-0 shadow-md card-hover cursor-pointer",
              project.status === "active" && "ring-2 ring-primary/20"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{project.emoji}</span>
                  <div>
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-xs text-muted-foreground">Phase {project.phase}/5</p>
                  </div>
                </div>
                <Badge className={cn("text-xs", getStatusColor(project.status))}>
                  {project.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {project.lastUpdated}
                  </div>
                  {project.status === "active" && (
                    <div className="flex items-center gap-1 text-success">
                      <TrendingUp className="h-3 w-3" />
                      Active
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
