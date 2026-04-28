"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { calculateWeeklyAverage } from "@/lib/calculator";
import { type DailyPlan, type LoggedMeal } from "@/lib/domain";
import { addDays, formatDateKey, formatMonthDay, getWeekDateKeys } from "@/lib/format";
import { useTrackerStore } from "@/store/tracker-store";
import { WeeklySummaryCard } from "@/components/tracker/weekly-summary-card";

function ChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 h-[260px]">{children}</div>
    </section>
  );
}

export function StatsScreen() {
  const [period, setPeriod] = useState<7 | 30>(30);
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const meals = useTrackerStore((state) => state.meals);
  const bodyRecords = useTrackerStore((state) => state.bodyRecords);
  const weeklyPlan = useTrackerStore((state) => state.weeklyPlan);
  const weeklySummaries = useTrackerStore((state) => state.weeklySummaries);
  const recentBodyRecords = bodyRecords
    .slice(-period)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((record) => ({
    ...record,
    label: formatMonthDay(record.date)
  }));
  const weekDates = getWeekDateKeys(selectedDate);

  function totalsForDate(date: string) {
    return meals
      .filter((meal) => meal.date === date)
      .reduce(
        (sum, meal) => ({
          calories: sum.calories + meal.calories,
          protein: sum.protein + meal.protein,
          fat: sum.fat + meal.fat,
          carbs: sum.carbs + meal.carbs
        }),
        {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0
        }
      );
  }

  const adherencePlans: DailyPlan[] = weeklyPlan.days.map((day, index) => {
    const totals = totalsForDate(weekDates[index]);

    return {
      dayType: day.dayType,
      targetCalories: day.targetCalories,
      targetProteinG: day.targetProteinG,
      targetFatG: day.targetFatG,
      targetCarbsG: day.targetCarbsG,
      actualCalories: totals.calories,
      actualProteinG: totals.protein,
      actualFatG: totals.fat,
      actualCarbsG: totals.carbs
    };
  });

  const weeklyAverage = calculateWeeklyAverage(adherencePlans);
  const weeklyAdherence = weeklyPlan.days.map((day, index) => {
    const totals = totalsForDate(weekDates[index]);
    const adherence = day.targetCalories > 0 ? Number(((totals.calories / day.targetCalories) * 100).toFixed(1)) : 0;

    return {
      day: `周${["一", "二", "三", "四", "五", "六", "日"][index]}`,
      targetCalories: day.targetCalories,
      actualCalories: Math.round(totals.calories),
      adherence
    };
  });

  const recentMeals = meals
    .filter((meal) => meal.date >= formatDateKey(addDays(new Date(selectedDate), -(period - 1))) && meal.date <= selectedDate)
    .sort((left, right) => left.date.localeCompare(right.date));

  const macroDistribution = buildMacroDistribution(recentMeals);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">数据统计</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">趋势与执行情况</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-secondary p-1">
          {[7, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value as 7 | 30)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                period === value ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              近{value}天
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">本周热量达成</p>
          <p className="mt-2 text-3xl font-semibold">{Math.round(weeklyAverage.calories.percentage)}%</p>
        </div>
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">本周平均蛋白质</p>
          <p className="mt-2 text-3xl font-semibold">{Math.round(weeklyAverage.protein.actual)}g</p>
        </div>
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">本周平均碳水</p>
          <p className="mt-2 text-3xl font-semibold">{Math.round(weeklyAverage.carbs.actual)}g</p>
        </div>
        <div className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <p className="text-sm text-muted-foreground">最新腰围</p>
          <p className="mt-2 text-3xl font-semibold">{recentBodyRecords.at(-1)?.waistCm ?? "--"} cm</p>
        </div>
      </div>

      <WeeklySummaryCard report={weeklySummaries.at(-1)} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={`最近 ${period} 天体重趋势`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentBodyRecords}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={false} name="体重" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="每周热量执行率">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyAdherence}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="adherence" fill="#10b981" radius={[10, 10, 0, 0]} name="执行率%">
                {weeklyAdherence.map((entry) => (
                  <Cell key={entry.day} fill={entry.adherence >= 95 ? "#10b981" : "#84cc16"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="宏量营养比例">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={4}
              >
                {macroDistribution.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="体脂与腰围趋势">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentBodyRecords}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="bodyFatPercentage" stroke="#22c55e" strokeWidth={2.5} dot={false} name="体脂%" />
              <Line type="monotone" dataKey="waistCm" stroke="#0f766e" strokeWidth={2.5} dot={false} name="腰围" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function buildMacroDistribution(meals: LoggedMeal[]) {
  const totals = meals.reduce(
    (sum, meal) => ({
      protein: sum.protein + meal.protein,
      fat: sum.fat + meal.fat,
      carbs: sum.carbs + meal.carbs
    }),
    {
      protein: 0,
      fat: 0,
      carbs: 0
    }
  );

  const total = totals.protein + totals.fat + totals.carbs;

  if (total <= 0) {
    return [
      { name: "蛋白质", value: 0, fill: "#0f9f69" },
      { name: "脂肪", value: 0, fill: "#84cc16" },
      { name: "碳水", value: 0, fill: "#bbf7d0" }
    ];
  }

  return [
    { name: "蛋白质", value: Number(((totals.protein / total) * 100).toFixed(1)), fill: "#0f9f69" },
    { name: "脂肪", value: Number(((totals.fat / total) * 100).toFixed(1)), fill: "#84cc16" },
    { name: "碳水", value: Number(((totals.carbs / total) * 100).toFixed(1)), fill: "#bbf7d0" }
  ];
}
