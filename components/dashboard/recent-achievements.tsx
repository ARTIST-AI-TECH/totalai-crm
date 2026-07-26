"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Zap } from "lucide-react";

export function RecentAchievements() {
  const achievements = [
    {
      icon: Trophy,
      title: "First Phase Complete",
      description: "Completed Meta Prompt phase",
      color: "text-accent",
      bgColor: "bg-accent-light",
      date: "2 days ago",
    },
    {
      icon: Star,
      title: "10 Questions Streak",
      description: "Answered 10 questions in a row",
      color: "text-primary",
      bgColor: "bg-primary-light",
      date: "3 days ago",
    },
    {
      icon: Target,
      title: "Validation Expert",
      description: "Completed Market category",
      color: "text-success",
      bgColor: "bg-success-light",
      date: "1 week ago",
    },
    {
      icon: Zap,
      title: "Early Adopter",
      description: "Joined TOTFL community",
      color: "text-info",
      bgColor: "bg-info-light",
      date: "2 weeks ago",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Recent Achievements</h3>
        <Badge variant="secondary" className="text-xs">4 earned</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.title} className="border-0 shadow-md card-hover">
            <CardContent className="p-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${achievement.bgColor} mb-3`}>
                <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
              </div>
              <h4 className="font-semibold mb-1 text-sm">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
              <span className="text-xs text-muted-foreground">{achievement.date}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
