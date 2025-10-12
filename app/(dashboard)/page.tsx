"use client";

import { CurrentProjectCard } from "@/components/dashboard/current-project-card";
import { PhaseJourney } from "@/components/dashboard/phase-journey";
import { ProjectsGrid } from "@/components/dashboard/projects-grid";
import { DailyCoachingWidget } from "@/components/dashboard/daily-coaching-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentAchievements } from "@/components/dashboard/recent-achievements";

export default function HomePage() {
  // Mock data - will be replaced with real data from backend
  const currentProject = {
    name: "SaaS Validation Platform",
    emoji: "🚀",
    currentPhase: 2,
    progress: 43,
    questionsAnswered: 23,
    totalQuestions: 99,
  };

  const projects = [
    {
      id: "1",
      name: "SaaS Validation Platform",
      emoji: "🚀",
      phase: 2,
      progress: 43,
      status: "active" as const,
      lastUpdated: "2 hours ago",
    },
    {
      id: "2",
      name: "AI Writing Assistant",
      emoji: "✍️",
      phase: 1,
      progress: 15,
      status: "paused" as const,
      lastUpdated: "3 days ago",
    },
    {
      id: "3",
      name: "Fitness App Concept",
      emoji: "💪",
      phase: 5,
      progress: 100,
      status: "completed" as const,
      lastUpdated: "1 week ago",
    },
  ];

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Welcome back! 👋</h1>
          <p className="text-lg text-muted-foreground">Let's continue your validation journey</p>
        </div>

        {/* Current Project Card */}
        <CurrentProjectCard project={currentProject} />

        {/* Phase Journey */}
        <PhaseJourney currentPhase={currentProject.currentPhase} />

        {/* Daily Coaching Widget */}
        <DailyCoachingWidget />

        {/* Projects Grid */}
        <ProjectsGrid projects={projects} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Achievements */}
        <RecentAchievements />
      </div>
    </main>
  );
}
