import { useMemo } from 'react';
import type { Project } from '@/lib/api';
import { useScheduleStore } from '@/store/scheduleStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useTeamStore } from '@/store/teamStore';

export interface ProjectInsight {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info';
  badge: string;
  title: string;
  description: string;
  priority: number; // 1 = highest
}

// Construction tips and facts for when we don't have dynamic data
const constructionTips: Array<Omit<ProjectInsight, 'id' | 'priority'>> = [
  {
    type: 'tip',
    badge: 'Pro Tip',
    title: 'Quality concrete needs proper curing',
    description: 'Keep concrete moist for at least 7 days. This increases strength by up to 50%.',
  },
  {
    type: 'info',
    badge: 'Did You Know?',
    title: 'Steel prices fluctuate seasonally',
    description: 'Plan major steel purchases during monsoon season when demand typically drops.',
  },
  {
    type: 'tip',
    badge: 'Best Practice',
    title: 'Document everything with photos',
    description: 'Take before/after photos of each stage. Useful for disputes and future reference.',
  },
  {
    type: 'info',
    badge: 'Did You Know?',
    title: 'Natural light reduces electricity bills',
    description: 'South-facing windows in India provide optimal daylight without excessive heat.',
  },
  {
    type: 'tip',
    badge: 'Safety First',
    title: 'Conduct weekly safety inspections',
    description: 'Regular checks reduce accidents by 60%. Focus on scaffolding and excavation areas.',
  },
  {
    type: 'info',
    badge: 'Cost Saving',
    title: 'Bulk material orders save money',
    description: 'Ordering cement and steel in bulk can save 10-15% compared to small batches.',
  },
  {
    type: 'tip',
    badge: 'Planning Tip',
    title: 'Keep 10% buffer in your timeline',
    description: 'Weather delays and material shortages are common. Build contingency into your schedule.',
  },
  {
    type: 'info',
    badge: 'Quality Check',
    title: 'Test TMT bars before purchase',
    description: 'Request mill test certificates and verify ISI markings to ensure quality steel.',
  },
];

export function useProjectInsights(project: Project | null) {
  const schedulePhases = useScheduleStore((state) => state.phases);
  const budgetCategories = useBudgetStore((state) => state.categories);
  const teamMembers = useTeamStore((state) => state.members);

  const insights = useMemo(() => {
    const result: ProjectInsight[] = [];
    let priority = 1;

    // Task-related insights
    const allTasks = schedulePhases.flatMap((phase) => phase.tasks);
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter((t) => t.status === 'pending').length;
    const totalTasks = allTasks.length;

    // Check for overdue tasks
    const today = new Date();
    const overdueTasks = allTasks.filter((task) => {
      if (task.status === 'completed') return false;
      if (!task.endDate) return false;
      return new Date(task.endDate) < today;
    });

    if (overdueTasks.length > 0) {
      result.push({
        id: 'overdue-tasks',
        type: 'warning',
        badge: 'Action Needed',
        title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue`,
        description: 'Review and update task deadlines or mark them complete to stay on track.',
        priority: priority++,
      });
    }

    // Progress insights
    if (totalTasks > 0) {
      const progressPercent = Math.round((completedTasks / totalTasks) * 100);

      if (progressPercent >= 75 && progressPercent < 100) {
        result.push({
          id: 'almost-done',
          type: 'success',
          badge: 'Great Progress!',
          title: `${progressPercent}% complete - Almost there!`,
          description: `Only ${totalTasks - completedTasks} task${totalTasks - completedTasks > 1 ? 's' : ''} remaining to finish this project.`,
          priority: priority++,
        });
      }

      if (inProgressTasks > 5) {
        result.push({
          id: 'too-many-wip',
          type: 'warning',
          badge: 'Focus Tip',
          title: `${inProgressTasks} tasks in progress simultaneously`,
          description: 'Consider completing some tasks before starting new ones to maintain quality.',
          priority: priority++,
        });
      }

      if (pendingTasks > 0 && inProgressTasks === 0 && completedTasks > 0) {
        result.push({
          id: 'start-next',
          type: 'info',
          badge: 'Ready to Start',
          title: `${pendingTasks} tasks waiting to begin`,
          description: 'No active tasks - pick up the next task to keep momentum going.',
          priority: priority++,
        });
      }
    }

    // Phase-based insights
    const activePhase = schedulePhases.find((phase) => {
      const progress = phase.progress ?? 0;
      return progress > 0 && progress < 100;
    });

    if (activePhase) {
      const phaseProgress = activePhase.progress ?? 0;
      if (phaseProgress >= 90) {
        result.push({
          id: 'phase-almost-done',
          type: 'success',
          badge: 'Milestone Near',
          title: `${activePhase.name} is ${phaseProgress}% done`,
          description: 'Great work! Complete remaining tasks to move to the next phase.',
          priority: priority++,
        });
      }
    }

    // Budget insights
    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);

    if (totalBudget > 0) {
      const spentPercent = Math.round((totalSpent / totalBudget) * 100);

      // Check for overspending categories
      const overspentCategories = budgetCategories.filter(
        (cat) => cat.allocated > 0 && cat.spent > cat.allocated
      );

      if (overspentCategories.length > 0) {
        result.push({
          id: 'budget-overspent',
          type: 'warning',
          badge: 'Budget Alert',
          title: `${overspentCategories.length} categor${overspentCategories.length > 1 ? 'ies' : 'y'} over budget`,
          description: `${overspentCategories[0].name} exceeded by ${Math.round(((overspentCategories[0].spent - overspentCategories[0].allocated) / overspentCategories[0].allocated) * 100)}%. Review spending to avoid overruns.`,
          priority: priority++,
        });
      }

      // Budget is on track
      if (spentPercent > 0 && spentPercent <= 80 && overspentCategories.length === 0) {
        const projectProgress = project?.progress?.percentage ?? 0;
        if (spentPercent < projectProgress) {
          result.push({
            id: 'under-budget',
            type: 'success',
            badge: 'Budget Health',
            title: 'Project is under budget',
            description: `Spent ${spentPercent}% of budget with ${projectProgress}% work complete. Well managed!`,
            priority: priority++,
          });
        }
      }
    }

    // Team insights
    const activeMembers = teamMembers.filter((m) => m.status === 'active').length;
    const membersByRole = teamMembers.reduce(
      (acc, member) => {
        const role = member.role.toLowerCase();
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Mason-related insight based on progress
    if (project?.progress?.percentage !== undefined) {
      const progress = project.progress.percentage;
      const masons = membersByRole['mason'] || membersByRole['masonry'] || 0;

      if (progress > 60 && masons > 2) {
        result.push({
          id: 'reduce-masons',
          type: 'tip',
          badge: 'Cost Optimization',
          title: "Your progress indicates you don't need more masons",
          description: 'Stick with the current crew to avoid budget overruns.',
          priority: priority++,
        });
      }
    }

    // Small team warning
    if (activeMembers > 0 && activeMembers < 3 && totalTasks > 10) {
      result.push({
        id: 'small-team',
        type: 'info',
        badge: 'Team Size',
        title: `${activeMembers} team member${activeMembers > 1 ? 's' : ''} handling ${totalTasks} tasks`,
        description: 'Consider adding more team members to maintain timeline.',
        priority: priority++,
      });
    }

    // Add random construction tips to fill gaps (ensure we always have at least 3 insights)
    const minInsights = 3;
    if (result.length < minInsights) {
      const shuffledTips = [...constructionTips].sort(() => Math.random() - 0.5);
      for (let i = 0; result.length < minInsights && i < shuffledTips.length; i++) {
        const tip = shuffledTips[i];
        result.push({
          id: `tip-${i}`,
          ...tip,
          priority: priority++,
        });
      }
    }

    // Sort by priority
    return result.sort((a, b) => a.priority - b.priority);
  }, [project, schedulePhases, budgetCategories, teamMembers]);

  return { insights };
}

// Get today's date formatted nicely
export function getFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  return now.toLocaleDateString('en-IN', options);
}

// Get weather icon based on condition code
export function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  };
  return iconMap[iconCode] || '🌤️';
}
