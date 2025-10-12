"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, CheckCircle2 } from "lucide-react";

interface CurrentProjectCardProps {
  project: {
    name: string;
    emoji: string;
    currentPhase: number;
    progress: number;
    questionsAnswered: number;
    totalQuestions: number;
  };
}

export function CurrentProjectCard({ project }: CurrentProjectCardProps) {
  const phaseNames = [
    "Foundation",
    "Market Research",
    "Product Planning",
    "Design Brief",
    "Scope of Work"
  ];

  return (
    <Card className="overflow-hidden border-0 shadow-lg card-hover bg-gradient-to-br from-primary-light to-white">
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{project.emoji}</div>
            <div>
              <h2 className="text-2xl font-semibold mb-1">{project.name}</h2>
              <Badge className="bg-primary text-primary-foreground">
                Phase {project.currentPhase}: {phaseNames[project.currentPhase - 1]}
              </Badge>
            </div>
          </div>
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary-hover shadow-primary">
            <Play className="h-5 w-5" />
            Continue Coaching
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" indicatorClassName="bg-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Questions Answered</span>
              </div>
              <p className="text-2xl font-bold">{project.questionsAnswered}/{project.totalQuestions}</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">Documents Generated</span>
              </div>
              <p className="text-2xl font-bold">{project.currentPhase}/5</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
