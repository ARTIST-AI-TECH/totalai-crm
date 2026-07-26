"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseJourneyProps {
  currentPhase: number;
}

export function PhaseJourney({ currentPhase }: PhaseJourneyProps) {
  const phases = [
    { number: 1, name: "Meta Prompt", icon: "📝", color: "phase-1" },
    { number: 2, name: "Market", icon: "📊", color: "phase-2" },
    { number: 3, name: "PRD", icon: "📋", color: "phase-3" },
    { number: 4, name: "UI/UX", icon: "🎨", color: "phase-4" },
    { number: 5, name: "SOW", icon: "📑", color: "phase-5" },
  ];

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold">Your Validation Journey</h3>
          <span className="text-sm text-muted-foreground">Phase {currentPhase} of 5</span>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentPhase - 1) / 4) * 100}%` }}
            />
          </div>

          {/* Phase Steps */}
          <div className="relative flex items-start justify-between">
            {phases.map((phase, index) => {
              const isCompleted = phase.number < currentPhase;
              const isCurrent = phase.number === currentPhase;
              const isLocked = phase.number > currentPhase;

              return (
                <div key={phase.number} className="flex flex-col items-center gap-2 flex-1">
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300",
                      isCompleted && "bg-primary border-primary shadow-primary",
                      isCurrent && "bg-white border-primary shadow-lg scale-110",
                      isLocked && "bg-secondary border-border"
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-8 w-8 text-white" />
                    )}
                    {isCurrent && (
                      <span className="text-3xl animate-pulse">{phase.icon}</span>
                    )}
                    {isLocked && (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {phase.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Phase {phase.number}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
