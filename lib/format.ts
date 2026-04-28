export const MONDAY_FIRST_WEEK_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

export const SHORT_WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

export function getTodayDateString(date = new Date()) {
  return formatDateKey(date);
}

export function formatDateKey(date: Date | string) {
  const source = typeof date === "string" ? new Date(date) : date;
  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, "0");
  const day = String(source.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMondayFirstDayIndex(date: Date | string) {
  const source = typeof date === "string" ? new Date(date) : date;
  return (source.getDay() + 6) % 7;
}

export function formatChineseDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const source = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
    ...options
  }).format(source);
}

export function formatMonthDay(date: Date | string) {
  const source = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric"
  }).format(source);
}

export function addDays(date: Date | string, offset: number) {
  const source = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  source.setDate(source.getDate() + offset);
  return source;
}

export function getStartOfWeek(date: Date | string) {
  const source = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  const mondayFirstIndex = getMondayFirstDayIndex(source);
  source.setHours(0, 0, 0, 0);
  source.setDate(source.getDate() - mondayFirstIndex);
  return source;
}

export function getWeekDateKeys(date: Date | string) {
  const start = getStartOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => formatDateKey(addDays(start, index)));
}
