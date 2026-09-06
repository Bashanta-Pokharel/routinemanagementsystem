import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeStr: string) {
  if (!timeStr) return "";
  return timeStr;
}

export interface TeacherColorTheme {
  avatar: string;
  badge: string;
  tag: string;
  border: string;
  pill: string;
  accent: string;
}

const TEACHER_PALETTES: TeacherColorTheme[] = [
  {
    avatar: "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    tag: "bg-indigo-50/80 text-indigo-900 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800",
    border: "border-l-indigo-500",
    pill: "bg-indigo-600 text-white",
    accent: "text-indigo-600 dark:text-indigo-400"
  },
  {
    avatar: "bg-gradient-to-tr from-emerald-600 to-teal-600 text-white",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    tag: "bg-emerald-50/80 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
    border: "border-l-emerald-500",
    pill: "bg-emerald-600 text-white",
    accent: "text-emerald-600 dark:text-emerald-400"
  },
  {
    avatar: "bg-gradient-to-tr from-amber-500 to-orange-600 text-white",
    badge: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    tag: "bg-amber-50/80 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
    border: "border-l-amber-500",
    pill: "bg-amber-600 text-white",
    accent: "text-amber-600 dark:text-amber-400"
  },
  {
    avatar: "bg-gradient-to-tr from-rose-500 to-pink-600 text-white",
    badge: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    tag: "bg-rose-50/80 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800",
    border: "border-l-rose-500",
    pill: "bg-rose-600 text-white",
    accent: "text-rose-600 dark:text-rose-400"
  },
  {
    avatar: "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
    tag: "bg-cyan-50/80 text-cyan-900 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-200 dark:border-cyan-800",
    border: "border-l-cyan-500",
    pill: "bg-cyan-600 text-white",
    accent: "text-cyan-600 dark:text-cyan-400"
  },
  {
    avatar: "bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white",
    badge: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    tag: "bg-purple-50/80 text-purple-900 border-purple-200 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-800",
    border: "border-l-purple-500",
    pill: "bg-purple-600 text-white",
    accent: "text-purple-600 dark:text-purple-400"
  },
  {
    avatar: "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white",
    badge: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    tag: "bg-blue-50/80 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
    border: "border-l-blue-500",
    pill: "bg-blue-600 text-white",
    accent: "text-blue-600 dark:text-blue-400"
  },
  {
    avatar: "bg-gradient-to-tr from-teal-600 to-emerald-700 text-white",
    badge: "bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    tag: "bg-teal-50/80 text-teal-900 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800",
    border: "border-l-teal-500",
    pill: "bg-teal-600 text-white",
    accent: "text-teal-600 dark:text-teal-400"
  },
  {
    avatar: "bg-gradient-to-tr from-lime-600 to-emerald-600 text-white",
    badge: "bg-lime-50 text-lime-900 border-lime-200 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800",
    tag: "bg-lime-50/80 text-lime-900 border-lime-200 dark:bg-lime-950/50 dark:text-lime-200 dark:border-lime-800",
    border: "border-l-lime-500",
    pill: "bg-lime-600 text-white",
    accent: "text-lime-600 dark:text-lime-400"
  },
  {
    avatar: "bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white",
    badge: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800",
    tag: "bg-fuchsia-50/80 text-fuchsia-900 border-fuchsia-200 dark:bg-fuchsia-950/50 dark:text-fuchsia-200 dark:border-fuchsia-800",
    border: "border-l-fuchsia-500",
    pill: "bg-fuchsia-600 text-white",
    accent: "text-fuchsia-600 dark:text-fuchsia-400"
  }
];

export function getTeacherColor(nameOrId: string | number | undefined | null): TeacherColorTheme {
  if (!nameOrId) return TEACHER_PALETTES[0];
  const str = String(nameOrId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TEACHER_PALETTES.length;
  return TEACHER_PALETTES[index];
}
