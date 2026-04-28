"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { type BootstrapPayload } from "@/lib/domain";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

export function AuthProvider({
  children,
  initialUser,
  isConfigured
}: {
  children: React.ReactNode;
  initialUser: User | null;
  isConfigured: boolean;
}) {
  const setUser = useAuthStore((state) => state.setUser);
  const setConfigured = useAuthStore((state) => state.setConfigured);
  const clearServerData = useTrackerStore((state) => state.clearServerData);
  const serverDataOwnerId = useTrackerStore((state) => state.serverDataOwnerId);
  const setServerDataOwnerId = useTrackerStore((state) => state.setServerDataOwnerId);
  const hydrateProfileFromServer = useTrackerStore((state) => state.hydrateProfileFromServer);
  const hydrateMealsFromServer = useTrackerStore((state) => state.hydrateMealsFromServer);
  const hydrateBodyRecordsFromServer = useTrackerStore((state) => state.hydrateBodyRecordsFromServer);
  const hydrateExercisesFromServer = useTrackerStore((state) => state.hydrateExercisesFromServer);
  const hydrateWeeklyPlanFromServer = useTrackerStore((state) => state.hydrateWeeklyPlanFromServer);
  const hydrateMealTemplatesFromServer = useTrackerStore((state) => state.hydrateMealTemplatesFromServer);
  const hydrateWaterLogsFromServer = useTrackerStore((state) => state.hydrateWaterLogsFromServer);
  const weeklySummaries = useTrackerStore((state) => state.weeklySummaries);
  const achievements = useTrackerStore((state) => state.achievements);
  const hydrateWeeklySummariesFromServer = useTrackerStore((state) => state.hydrateWeeklySummariesFromServer);
  const hydrateAchievementsFromServer = useTrackerStore((state) => state.hydrateAchievementsFromServer);
  const previousUserIdRef = useRef<string | null>(null);
  const [hasBootstrappedServerData, setHasBootstrappedServerData] = useState(false);

  useEffect(() => {
    setUser(initialUser);
    setConfigured(isConfigured);
  }, [initialUser, isConfigured, setConfigured, setUser]);

  useEffect(() => {
    const currentUserId = initialUser?.id ?? null;

    if (serverDataOwnerId && currentUserId && serverDataOwnerId !== currentUserId) {
      clearServerData();
    }

    if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
      clearServerData();
    }

    previousUserIdRef.current = currentUserId;
  }, [clearServerData, initialUser?.id, serverDataOwnerId]);

  useEffect(() => {
    let active = true;

    async function syncProfile() {
      setHasBootstrappedServerData(false);

      if (!isConfigured) {
        return;
      }

      if (!initialUser) {
        clearServerData();
        return;
      }

      const response = await fetch("/api/bootstrap", {
        credentials: "include"
      });

      if (!active) {
        return;
      }

      if (response.status === 401) {
        clearServerData();
        return;
      }

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as BootstrapPayload;

      if (!active) {
        return;
      }

      hydrateProfileFromServer(payload.profile);
      hydrateMealsFromServer(payload.meals);
      hydrateBodyRecordsFromServer(payload.bodyRecords);
      hydrateExercisesFromServer(payload.exercises);
      hydrateWeeklyPlanFromServer(payload.dailyPlans);
      hydrateMealTemplatesFromServer(payload.mealTemplates);
      hydrateWaterLogsFromServer(payload.waterLogs);
      hydrateWeeklySummariesFromServer(payload.weeklySummaries);
      hydrateAchievementsFromServer(payload.achievements);
      setServerDataOwnerId(initialUser.id);
      setHasBootstrappedServerData(true);
    }

    void syncProfile();

    return () => {
      active = false;
    };
  }, [
    hydrateBodyRecordsFromServer,
    hydrateAchievementsFromServer,
    hydrateMealTemplatesFromServer,
    hydrateExercisesFromServer,
    hydrateMealsFromServer,
    hydrateProfileFromServer,
    hydrateWaterLogsFromServer,
    hydrateWeeklySummariesFromServer,
    hydrateWeeklyPlanFromServer,
    clearServerData,
    initialUser,
    isConfigured,
    setServerDataOwnerId
  ]);

  useEffect(() => {
    let active = true;

    async function syncDerivedData() {
      if (!isConfigured || !initialUser) {
        return;
      }

      await fetch("/api/weekly-summaries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          summaries: weeklySummaries.map((summary) => ({
            weekKey: summary.weekKey,
            weekLabel: summary.weekLabel,
            adherenceRate: summary.adherenceRate,
            weightChange: summary.weightChange,
            calorieAverage: summary.calorieAverage,
            proteinAverage: summary.proteinAverage,
            fatAverage: summary.fatAverage,
            carbsAverage: summary.carbsAverage,
            motivationalMessage: summary.motivationalMessage,
            comparisonJson: summary.lastWeekComparison ? JSON.stringify(summary.lastWeekComparison) : null
          }))
        })
      });

      if (!active) {
        return;
      }

      await fetch("/api/achievements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          achievements: achievements.map((achievement) => ({
            key: achievement.id,
            title: achievement.title,
            description: achievement.description,
            unlocked: achievement.unlocked,
            unlockedAt: achievement.unlockedAt ?? null,
            progress: achievement.progress
          }))
        })
      });
    }

    if (hasBootstrappedServerData && (weeklySummaries.length > 0 || achievements.length > 0)) {
      void syncDerivedData();
    }

    return () => {
      active = false;
    };
  }, [achievements, hasBootstrappedServerData, initialUser, isConfigured, weeklySummaries]);

  return <>{children}</>;
}
