"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Timer } from "lucide-react";

export function DailyCoachingWidget() {
  const usedMinutes = 32;
  const totalMinutes = 60;
  const remainingMinutes = totalMinutes - usedMinutes;
  const percentage = (usedMinutes / totalMinutes) * 100;

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-accent-light to-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">Today's Coaching Session</h3>
            <p className="text-sm text-muted-foreground">Stay on track with daily guidance</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-accent" />
              <span className="font-medium">{remainingMinutes} minutes remaining</span>
            </div>
            <span className="text-sm text-muted-foreground">{usedMinutes}/{totalMinutes} min</span>
          </div>

          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-accent transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <Button className="w-full bg-accent hover:bg-accent-hover text-accent-foreground shadow-accent gap-2">
            <Mic className="h-4 w-4" />
            Start Voice Coaching
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
