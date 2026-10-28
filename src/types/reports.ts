export interface WeeklyReportRow {
  date: string;
  dayType: string;
  targetCalories: number;
  consumedCalories: number;
  targetProtein: number;
  consumedProtein: number;
  targetCarbs: number;
  consumedCarbs: number;
  targetFat: number;
  consumedFat: number;
  completedMeals: number;
  totalMeals: number;
  adherencePercent: number;
}

export interface MonthlyReportSummary {
  totalCalories: number;
  avgDailyCalories: number;
  avgDailyProtein: number;
  completeDays: number;
  lowIntakeDays: number;
  highIntakeDays: number;
}
