"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Plus, Trash2, Clock, Calendar, CheckCircle2, 
  Printer, Download, ArrowRight, User, BookOpen, Layers, Coffee, Zap,
  RotateCcw, ShieldCheck, Check, AlertCircle, Eye, FileSpreadsheet, LayoutGrid
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchApi, downloadExportFile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CampusRoutineSheet } from "@/components/CampusRoutineSheet";
import { LiveWatchModal } from "@/components/LiveWatchModal";
import { useCampusInfo } from "@/lib/campusSettings";
import Link from "next/link";

interface TeacherItem {
  id: string;
  name: string;
  abbreviation: string;
  contact: string;
  speciality: string;
  free_time_start: string;
  free_time_end: string;
  max_classes_per_day: number;
}

interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  course_type?: "TH" | "PR" | "TU";
  weekly_periods: number;
  teacher_name: string;
}

interface SemesterBlock {
  semester_number: number;
  semester_name: string;
  section_name: string;
  room_name: string;
  is_active: boolean;
  subjects: SubjectItem[];
}

export function SimpleRoutineWizard() {
  // Global Campus Information (Reactive across all components & live watch)
  const { campusInfo, updateCampusInfo } = useCampusInfo();

  // Database reset state
  const [resettingDb, setResettingDb] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Step 1: Faculty / Teachers with Specialty, Abbreviation, Contact and Free Time
  const [teachers, setTeachers] = useState<TeacherItem[]>([
    {
      id: "t1",
      name: "Bhupendra Ram Luhar",
      abbreviation: "BRL",
      contact: "9848811584",
      speciality: "Microprocessor & Comp Architecture",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t2",
      name: "Shree krishna Maharjan",
      abbreviation: "SKM",
      contact: "9841299009",
      speciality: "Discrete Structure & Networks",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t3",
      name: "Ananda KC",
      abbreviation: "AK",
      contact: "9851223176",
      speciality: "OOP in Java & Software Eng",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t4",
      name: "Sharmila Bhattarai",
      abbreviation: "SB",
      contact: "9844638055",
      speciality: "Statistics & Numerical Methods",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t5",
      name: "Bijaya Mishra",
      abbreviation: "BM",
      contact: "9841695609",
      speciality: "Web Technology & UI/UX",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t6",
      name: "Prakash Sharma",
      abbreviation: "PRS",
      contact: "9841334455",
      speciality: "Python, AI & Machine Learning",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t7",
      name: "Dipendra Nepal",
      abbreviation: "DN",
      contact: "9841556677",
      speciality: "DBMS, Dotnet & Cloud",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t8",
      name: "Ramesh Shrestha",
      abbreviation: "RS",
      contact: "9841778899",
      speciality: "OS & Cyber Security",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t9",
      name: "Pujan Mahat",
      abbreviation: "PM",
      contact: "9841990011",
      speciality: "Mathematics",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t10",
      name: "Sabita Thapa",
      abbreviation: "ST",
      contact: "9841223344",
      speciality: "Communication, Economics & Ethics",
      free_time_start: "06:30 AM",
      free_time_end: "04:30 PM",
      max_classes_per_day: 4,
    },
  ]);

  // Step 2 & 3: Official BCA Semesters (1 to 8) with all Syllabus Subjects (Theory & Practical only - Zero Tutorial)
  const [semesters, setSemesters] = useState<SemesterBlock[]>([
    {
      semester_number: 1,
      semester_name: "BCA 1st Semester",
      section_name: "BCA 1st Sem",
      room_name: "Room 101",
      is_active: true,
      subjects: [
        { id: "s1_1", name: "Computer Fundamentals and Applications", code: "BCA 101", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s1_2", name: "Programming in C", code: "BCA 102", course_type: "TH", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s1_3", name: "Digital Logic", code: "BCA 103", course_type: "TH", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s1_4", name: "Mathematics-I", code: "BCA 104", course_type: "TH", weekly_periods: 3, teacher_name: "Pujan Mahat" },
        { id: "s1_5", name: "Professional Communication and Ethics", code: "BCA 105", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s1_1_pr", name: "Computer Fundamentals and Applications (Lab)", code: "BCA 101", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s1_2_pr", name: "Programming in C (Lab)", code: "BCA 102", course_type: "PR", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s1_3_pr", name: "Digital Logic (Lab / Practical)", code: "BCA 103", course_type: "PR", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s1_4_pr", name: "Mathematics-I (Practical / Problem Lab)", code: "BCA 104", course_type: "PR", weekly_periods: 3, teacher_name: "Pujan Mahat" },
        { id: "s1_5_pr", name: "Professional Communication (Language Lab)", code: "BCA 105", course_type: "PR", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s1_6", name: "Hardware Workshop", code: "BCA 106", course_type: "PR", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
      ]
    },
    {
      semester_number: 2,
      semester_name: "BCA 2nd Semester",
      section_name: "BCA 2nd Sem",
      room_name: "Room 102",
      is_active: false,
      subjects: [
        { id: "s2_1", name: "Discrete Structure", code: "BCA 151", course_type: "TH", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s2_2", name: "Microprocessor and Computer Architecture", code: "BCA 152", course_type: "TH", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s2_3", name: "OOP in Java", code: "BCA 153", course_type: "TH", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s2_4", name: "Mathematics-II", code: "BCA 154", course_type: "TH", weekly_periods: 3, teacher_name: "Pujan Mahat" },
        { id: "s2_5", name: "UX/UI Design", code: "BCA 155", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s2_1_pr", name: "Discrete Structure (Lab)", code: "BCA 151", course_type: "PR", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s2_2_pr", name: "Microprocessor & Architecture (Lab)", code: "BCA 152", course_type: "PR", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s2_3_pr", name: "OOP in Java (Lab)", code: "BCA 153", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s2_4_pr", name: "Mathematics-II (Practical)", code: "BCA 154", course_type: "PR", weekly_periods: 3, teacher_name: "Pujan Mahat" },
        { id: "s2_5_pr", name: "UX/UI Design (Lab)", code: "BCA 155", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s2_6", name: "Principles of Management", code: "BCA 156", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
      ]
    },
    {
      semester_number: 3,
      semester_name: "BCA 3rd Semester",
      section_name: "BCA 3rd Sem",
      room_name: "Room 201",
      is_active: true,
      subjects: [
        { id: "s3_1", name: "Data Structure and Algorithms", code: "BCA 201", course_type: "TH", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s3_2", name: "Database Management System", code: "BCA 202", course_type: "TH", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s3_3", name: "Web Technology-I", code: "BCA 203", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s3_4", name: "System Analysis and Design", code: "BCA 204", course_type: "TH", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s3_5", name: "Probability and Statistics", code: "BCA 205", course_type: "TH", weekly_periods: 3, teacher_name: "Sharmila Bhattarai" },
        { id: "s3_1_pr", name: "Data Structure & Algorithms (Lab)", code: "BCA 201", course_type: "PR", weekly_periods: 3, teacher_name: "Bhupendra Ram Luhar" },
        { id: "s3_2_pr", name: "Database Management System (Lab)", code: "BCA 202", course_type: "PR", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s3_3_pr", name: "Web Technology-I (Lab)", code: "BCA 203", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s3_4_pr", name: "System Analysis & Design (Lab)", code: "BCA 204", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s3_5_pr", name: "Probability & Statistics (Lab)", code: "BCA 205", course_type: "PR", weekly_periods: 3, teacher_name: "Sharmila Bhattarai" },
        { id: "s3_6", name: "Applied Economics", code: "BCA 206", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
      ]
    },
    {
      semester_number: 4,
      semester_name: "BCA 4th Semester",
      section_name: "BCA 4th Sem",
      room_name: "Room 202",
      is_active: false,
      subjects: [
        { id: "s4_1", name: "Operating Systems", code: "BCA 251", course_type: "TH", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s4_2", name: "Software Engineering", code: "BCA 252", course_type: "TH", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s4_3", name: "Numerical Methods", code: "BCA 253", course_type: "TH", weekly_periods: 3, teacher_name: "Sharmila Bhattarai" },
        { id: "s4_4", name: "Python Programming", code: "BCA 254", course_type: "TH", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s4_5", name: "Web Technology-II", code: "BCA 255", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s4_1_pr", name: "Operating Systems (Lab)", code: "BCA 251", course_type: "PR", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s4_2_pr", name: "Software Engineering (Lab / Case Study)", code: "BCA 252", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s4_3_pr", name: "Numerical Methods (Lab)", code: "BCA 253", course_type: "PR", weekly_periods: 3, teacher_name: "Sharmila Bhattarai" },
        { id: "s4_4_pr", name: "Python Programming (Lab)", code: "BCA 254", course_type: "PR", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s4_5_pr", name: "Web Technology-II (Lab)", code: "BCA 255", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s4_6", name: "Project-I (Project Lab)", code: "BCA 256", course_type: "PR", weekly_periods: 3, teacher_name: "Prakash Sharma" },
      ]
    },
    {
      semester_number: 5,
      semester_name: "BCA 5th Semester",
      section_name: "BCA 5th Sem",
      room_name: "Room 301",
      is_active: true,
      subjects: [
        { id: "s5_1", name: "Computer Network", code: "BCA 301", course_type: "TH", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s5_2", name: "Artificial Intelligence", code: "BCA 302", course_type: "TH", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s5_3", name: "Advance Java Programming", code: "BCA 303", course_type: "TH", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s5_4", name: "MIS and e-Business", code: "BCA 304", course_type: "TH", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s5_5", name: "Society and Technology", code: "BCA 305", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s5_1_pr", name: "Computer Network (Lab)", code: "BCA 301", course_type: "PR", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s5_2_pr", name: "Artificial Intelligence (Lab)", code: "BCA 302", course_type: "PR", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s5_3_pr", name: "Advance Java Programming (Lab)", code: "BCA 303", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s5_4_pr", name: "MIS and e-Business (Lab)", code: "BCA 304", course_type: "PR", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s5_5_pr", name: "Society and Technology (Practical)", code: "BCA 305", course_type: "PR", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s5_6", name: "Project-II (Project Lab)", code: "BCA 306", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
      ]
    },
    {
      semester_number: 6,
      semester_name: "BCA 6th Semester",
      section_name: "BCA 6th Sem",
      room_name: "Room 302",
      is_active: false,
      subjects: [
        { id: "s6_1", name: "Computer Graphics and animation", code: "BCA 351", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s6_2", name: "Mobile Programming", code: "BCA 352", course_type: "TH", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s6_3", name: "Cryptography and Network Security", code: "BCA 353", course_type: "TH", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s6_4", name: "Technical Writing", code: "BCA 354", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s6_5", name: "Distributed System", code: "BCA 355", course_type: "TH", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s6_1_pr", name: "Computer Graphics (Lab)", code: "BCA 351", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s6_2_pr", name: "Mobile Programming (Lab)", code: "BCA 352", course_type: "PR", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s6_3_pr", name: "Cryptography & Security (Lab)", code: "BCA 353", course_type: "PR", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s6_4_pr", name: "Technical Writing (Communication Lab)", code: "BCA 354", course_type: "PR", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s6_5_pr", name: "Distributed System (Lab)", code: "BCA 355", course_type: "PR", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s6_6", name: "Project-III (Mobile & Security Lab)", code: "BCA 356", course_type: "PR", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
      ]
    },
    {
      semester_number: 7,
      semester_name: "BCA 7th Semester",
      section_name: "BCA 7th Sem",
      room_name: "Room 401",
      is_active: false,
      subjects: [
        { id: "s7_1", name: "Cyber Security and Ethical Hacking", code: "BCA 401", course_type: "TH", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s7_2", name: "Software Project Management", code: "BCA 402", course_type: "TH", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s7_3", name: "Financial Accounting", code: "BCA 403", course_type: "TH", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s7_4", name: "Machine Learning (Elective-I)", code: "BCA 405", course_type: "TH", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s7_5", name: "Dotnet Technology (Elective-II)", code: "BCA 406", course_type: "TH", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s7_1_pr", name: "Cyber Security & Ethical Hacking (Lab)", code: "BCA 401", course_type: "PR", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
        { id: "s7_2_pr", name: "Software Project Management (Lab)", code: "BCA 402", course_type: "PR", weekly_periods: 3, teacher_name: "Ananda KC" },
        { id: "s7_3_pr", name: "Financial Accounting (Practical)", code: "BCA 403", course_type: "PR", weekly_periods: 3, teacher_name: "Sabita Thapa" },
        { id: "s7_4_pr", name: "Machine Learning (Lab)", code: "BCA 405", course_type: "PR", weekly_periods: 3, teacher_name: "Prakash Sharma" },
        { id: "s7_5_pr", name: "Dotnet Technology (Lab)", code: "BCA 406", course_type: "PR", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s7_6", name: "Project-IV (Cyber & ML Lab)", code: "BCA 404", course_type: "PR", weekly_periods: 3, teacher_name: "Ramesh Shrestha" },
      ]
    },
    {
      semester_number: 8,
      semester_name: "BCA 8th Semester",
      section_name: "BCA 8th Sem",
      room_name: "Room 402",
      is_active: false,
      subjects: [
        { id: "s8_1", name: "Cloud Computing", code: "BCA 451", course_type: "TH", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s8_2", name: "Network Administration (Elective-III)", code: "BCA 453", course_type: "TH", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s8_3", name: "Digital Marketing and SEO (Elective-IV)", code: "BCA 454", course_type: "TH", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s8_1_pr", name: "Cloud Computing (Lab)", code: "BCA 451", course_type: "PR", weekly_periods: 3, teacher_name: "Dipendra Nepal" },
        { id: "s8_2_pr", name: "Network Administration (Lab)", code: "BCA 453", course_type: "PR", weekly_periods: 3, teacher_name: "Shree krishna Maharjan" },
        { id: "s8_3_pr", name: "Digital Marketing (Lab)", code: "BCA 454", course_type: "PR", weekly_periods: 3, teacher_name: "Bijaya Mishra" },
        { id: "s8_4", name: "Internship & Project", code: "BCA 452", course_type: "PR", weekly_periods: 4, teacher_name: "Dipendra Nepal" },
      ]
    }
  ]);

  // Step 4: Days and Periods matching morning or day campus schedule
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  ]);

  const [selectedShift, setSelectedShift] = useState<"morning" | "day" | "evening" | "custom">("morning");

  const morningPeriods = [
    { name: "Period 1", start_time: "06:30 AM", end_time: "07:15 AM", type: "Teaching" },
    { name: "Period 2", start_time: "07:15 AM", end_time: "08:00 AM", type: "Teaching" },
    { name: "Period 3", start_time: "08:00 AM", end_time: "08:45 AM", type: "Teaching" },
    { name: "Interval", start_time: "08:45 AM", end_time: "09:05 AM", type: "Break" },
    { name: "Period 4", start_time: "09:05 AM", end_time: "09:50 AM", type: "Teaching" },
    { name: "Period 5", start_time: "09:50 AM", end_time: "10:30 AM", type: "Teaching" },
  ];

  const dayPeriods = [
    { name: "Period 1", start_time: "10:00 AM", end_time: "11:00 AM", type: "Teaching" },
    { name: "Period 2", start_time: "11:00 AM", end_time: "12:00 PM", type: "Teaching" },
    { name: "Period 3", start_time: "12:00 PM", end_time: "01:00 PM", type: "Teaching" },
    { name: "Interval", start_time: "01:00 PM", end_time: "01:30 PM", type: "Break" },
    { name: "Period 4", start_time: "01:30 PM", end_time: "02:30 PM", type: "Teaching" },
    { name: "Period 5", start_time: "02:30 PM", end_time: "03:30 PM", type: "Teaching" },
  ];

  const eveningPeriods = [
    { name: "Period 1", start_time: "04:00 PM", end_time: "04:45 PM", type: "Teaching" },
    { name: "Period 2", start_time: "04:45 PM", end_time: "05:30 PM", type: "Teaching" },
    { name: "Period 3", start_time: "05:30 PM", end_time: "06:15 PM", type: "Teaching" },
    { name: "Interval", start_time: "06:15 PM", end_time: "06:35 PM", type: "Break" },
    { name: "Period 4", start_time: "06:35 PM", end_time: "07:20 PM", type: "Teaching" },
    { name: "Period 5", start_time: "07:20 PM", end_time: "08:05 PM", type: "Teaching" },
  ];

  const [periods, setPeriods] = useState(morningPeriods);

  const handleShiftSelect = (shift: "morning" | "day" | "evening") => {
    setSelectedShift(shift);
    if (shift === "morning") {
      setPeriods(morningPeriods);
      setTeachers(prev => prev.map(t => ({
        ...t,
        free_time_start: "06:30 AM",
        free_time_end: "10:30 AM"
      })));
    } else if (shift === "day") {
      setPeriods(dayPeriods);
      setTeachers(prev => prev.map(t => ({
        ...t,
        free_time_start: "10:00 AM",
        free_time_end: "03:30 PM"
      })));
    } else if (shift === "evening") {
      setPeriods(eveningPeriods);
      setTeachers(prev => prev.map(t => ({
        ...t,
        free_time_start: "04:00 PM",
        free_time_end: "08:30 PM"
      })));
    }
  };

  const [dayPeriodCounts, setDayPeriodCounts] = useState<Record<string, number>>({
    "Sunday": 6,
    "Monday": 6,
    "Tuesday": 6,
    "Wednesday": 6,
    "Thursday": 6,
    "Friday": 6,
    "Saturday": 6,
  });

  // State for generation result
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<string>("");
  const [selectedTeacherTab, setSelectedTeacherTab] = useState<string>("");
  const [activeViewMode, setActiveViewMode] = useState<"sheet" | "table" | "teacher">("sheet");
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);

  // Storage keys for persistence across logins & sessions
  const ROUTINE_CACHE_KEY = "bca_generated_routine_cache";
  const SEMESTERS_STATE_KEY = "bca_wizard_semesters_state";
  const TEACHERS_STATE_KEY = "bca_wizard_teachers_state";
  const SHIFT_STATE_KEY = "bca_wizard_shift_state";
  const DAYS_STATE_KEY = "bca_wizard_days_state";
  const PERIODS_STATE_KEY = "bca_wizard_periods_state";

  // Automatically restore previously generated routine and form configuration on mount
  useEffect(() => {
    try {
      // 1. Restore Semesters State (e.g. Active Sem 1, Sem 3, Sem 5 with assigned subjects)
      const savedSemesters = localStorage.getItem(SEMESTERS_STATE_KEY);
      if (savedSemesters) {
        const parsed = JSON.parse(savedSemesters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSemesters(parsed);
        }
      }

      // 2. Restore Teachers
      const savedTeachers = localStorage.getItem(TEACHERS_STATE_KEY);
      if (savedTeachers) {
        const parsed = JSON.parse(savedTeachers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeachers(parsed);
        }
      }

      // 3. Restore Shift
      const savedShift = localStorage.getItem(SHIFT_STATE_KEY);
      if (savedShift) {
        setSelectedShift(savedShift as any);
      }

      // 4. Restore Days
      const savedDays = localStorage.getItem(DAYS_STATE_KEY);
      if (savedDays) {
        const parsed = JSON.parse(savedDays);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedDays(parsed);
        }
      }

      // 5. Restore Periods
      const savedPeriods = localStorage.getItem(PERIODS_STATE_KEY);
      if (savedPeriods) {
        const parsed = JSON.parse(savedPeriods);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPeriods(parsed);
        }
      }

      // 6. Restore Previously Generated Routine Result
      const savedRoutine = localStorage.getItem(ROUTINE_CACHE_KEY);
      if (savedRoutine) {
        const parsed = JSON.parse(savedRoutine);
        if (parsed && (parsed.semester_routines || parsed.teacher_routines || parsed.timetable_id)) {
          setGeneratedRoutine(parsed);
          const semKeys = Object.keys(parsed.semester_routines || {});
          if (semKeys.length > 0) setSelectedSemesterTab(semKeys[0]);
          const tKeys = Object.keys(parsed.teacher_routines || {});
          if (tKeys.length > 0) setSelectedTeacherTab(tKeys[0]);
        }
      }
    } catch (e) {
      console.warn("Could not restore previous routine cache:", e);
    }
  }, []);

  const allAvailableDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Helper auto-abbreviation
  const autoAbbrev = (name: string) => {
    return name
      .replace(/^(prof\.|dr\.|er\.|mr\.|mrs\.|ms\.)\s+/i, "")
      .split(/\s+/)
      .map(w => w[0]?.toUpperCase() || "")
      .join("");
  };

  // Handlers for Clean Reset
  const handleCleanResetDatabase = async () => {
    if (!confirm("Are you sure you want to delete all previous mock data and start with a clean BCA setup?")) {
      return;
    }
    setResettingDb(true);
    setResetMessage(null);
    try {
      const res = await fetchApi<any>("/seed/clean-reset", { method: "POST" });
      setResetMessage(res.message || "All default data cleared successfully!");
      setGeneratedRoutine(null);
      localStorage.removeItem(ROUTINE_CACHE_KEY);
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      alert("Reset failed: " + (err.message || "Unknown error"));
    } finally {
      setResettingDb(false);
    }
  };

  const handleClearAllFields = () => {
    if (!confirm("Clear all teachers and subjects from this form to start from scratch?")) return;
    setTeachers([]);
    setSemesters(semesters.map(s => ({ ...s, subjects: [] })));
    setGeneratedRoutine(null);
    try {
      localStorage.removeItem(ROUTINE_CACHE_KEY);
      localStorage.removeItem(SEMESTERS_STATE_KEY);
      localStorage.removeItem(TEACHERS_STATE_KEY);
    } catch (e) {}
  };

  // Teacher Handlers
  const handleAddTeacher = () => {
    const newIdx = teachers.length + 1;
    const defaultName = `Faculty Member ${newIdx}`;
    setTeachers([
      ...teachers,
      {
        id: `t_${Date.now()}`,
        name: defaultName,
        abbreviation: `T${newIdx}`,
        contact: "98XXXXXXXX",
        speciality: "Computer Science",
        free_time_start: "06:30 AM",
        free_time_end: "10:30 AM",
        max_classes_per_day: 4,
      }
    ]);
  };

  const handleRemoveTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const handleUpdateTeacher = (id: string, field: keyof TeacherItem, value: any) => {
    setTeachers(teachers.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, [field]: value };
      if (field === "name" && (!t.abbreviation || t.abbreviation.startsWith("T"))) {
        updated.abbreviation = autoAbbrev(value);
      }
      return updated;
    }));
  };

  // Semester & Subject Handlers
  const toggleSemester = (semNum: number) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        return { ...s, is_active: !s.is_active };
      }
      return s;
    }));
  };

  const handleAddSubjectToSemester = (semNum: number) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        const subCount = s.subjects.length + 1;
        const defaultTeacher = teachers.length > 0 ? teachers[0].name : "Faculty";
        const newSub: SubjectItem = {
          id: `s_${semNum}_${Date.now()}`,
          name: `Subject ${subCount}`,
          code: `CACS${semNum}0${subCount}`,
          course_type: "TH",
          weekly_periods: 4,
          teacher_name: defaultTeacher
        };
        return { ...s, subjects: [...s.subjects, newSub] };
      }
      return s;
    }));
  };

  const handleRemoveSubject = (semNum: number, subId: string) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        return { ...s, subjects: s.subjects.filter(sub => sub.id !== subId) };
      }
      return s;
    }));
  };

  // Helper to identify paired Theory and Practical subjects (e.g. C Programming <-> C Programming Lab, Java <-> Java Lab)
  const isRelatedSubjectPair = (subA: SubjectItem, subB: SubjectItem): boolean => {
    if (subA.id === subB.id) return false;
    
    // 1. Check Course Code Matching (e.g. BCA 102 vs BCA 102P, BCA 153 vs BCA 153P, BCA 201 vs BCA 201P)
    const codeA = (subA.code || "").replace(/[^\w]/g, "").toUpperCase();
    const codeB = (subB.code || "").replace(/[^\w]/g, "").toUpperCase();
    if (codeA && codeB) {
      if (codeA.startsWith(codeB) || codeB.startsWith(codeA)) return true;
      if (codeA.replace(/P$/, "") === codeB.replace(/P$/, "")) return true;
    }

    // 2. Keyword & Topic Matching in Name
    const nameA = (subA.name || "").toLowerCase();
    const nameB = (subB.name || "").toLowerCase();

    const topicGroups = [
      ["c prog", "programming in c", "c lab", "c programming"],
      ["java", "oop in java", "advance java", "java lab", "java programming"],
      ["dsa", "data structure", "dbms", "database"],
      ["python", "project-i", "project 1"],
      ["ai", "artificial intelligence", "project-ii", "project 2"],
      ["mobile", "crypto", "security lab", "project-iii", "project 3"],
      ["cyber", "ethical hacking", "machine learning", "project-iv", "project 4"],
      ["cloud", "internship", "cloud project"],
      ["hardware", "digital logic", "microprocessor"]
    ];

    for (const group of topicGroups) {
      const matchA = group.some(k => nameA.includes(k));
      const matchB = group.some(k => nameB.includes(k));
      if (matchA && matchB) return true;
    }

    return false;
  };

  const handleUpdateSubject = (semNum: number, subId: string, field: keyof SubjectItem, value: any) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        const targetSub = s.subjects.find(sub => sub.id === subId);
        return {
          ...s,
          subjects: s.subjects.map(sub => {
            if (sub.id === subId) {
              return { ...sub, [field]: value };
            }
            // Auto-sync Theory & Practical teacher: if teacher changed, assign the same teacher to related Lab/PR
            if (field === "teacher_name" && targetSub && isRelatedSubjectPair(targetSub, sub)) {
              return { ...sub, teacher_name: value };
            }
            return sub;
          })
        };
      }
      return s;
    }));
  };

  // Days & Periods Handlers
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handlePeriodCountChange = (day: string, count: number) => {
    const validCount = Math.max(1, Math.min(periods.length, count));
    setDayPeriodCounts((prev) => ({
      ...prev,
      [day]: validCount,
    }));
  };

  // Count how many subjects a teacher is assigned to across running semesters
  const getTeacherAssignedCount = (teacherName: string) => {
    let count = 0;
    semesters.filter(s => s.is_active).forEach(s => {
      s.subjects.forEach(sub => {
        if (sub.teacher_name === teacherName) count += sub.weekly_periods;
      });
    });
    return count;
  };

  // Generate BCA Multi-Semester Routine
  const handleCalculateRoutine = async () => {
    const activeSemesters = semesters.filter(s => s.is_active);
    if (activeSemesters.length === 0) {
      alert("Please select at least one running BCA semester.");
      return;
    }

    const totalSubjects = activeSemesters.reduce((acc, s) => acc + s.subjects.length, 0);
    if (totalSubjects === 0) {
      alert("Please add at least one subject to your running semesters.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        routine_title: campusInfo.routineTitle,
        campus_name: campusInfo.campusName,
        address: campusInfo.campusAddress,
        days: selectedDays,
        periods: periods,
        day_period_counts: dayPeriodCounts,
        teachers: teachers.map(t => ({
          name: t.name,
          abbreviation: t.abbreviation || autoAbbrev(t.name),
          contact: t.contact || undefined,
          phone: t.contact || undefined,
          speciality: t.speciality,
          free_time_start: t.free_time_start,
          free_time_end: t.free_time_end,
          free_days: selectedDays,
          max_classes_per_day: t.max_classes_per_day
        })),
        running_semesters: activeSemesters.map(s => ({
          semester_number: s.semester_number,
          semester_name: s.semester_name,
          section_name: s.section_name,
          room_name: s.room_name,
          subjects: s.subjects.map(sub => ({
            name: sub.name,
            code: sub.code,
            course_type: sub.course_type || "TH",
            weekly_periods: sub.weekly_periods,
            teacher_name: sub.teacher_name
          }))
        }))
      };

      const result = await fetchApi<any>("/timetable/bca-routine", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setGeneratedRoutine(result);
      const semKeys = Object.keys(result.semester_routines || {});
      if (semKeys.length > 0) setSelectedSemesterTab(semKeys[0]);
      const tKeys = Object.keys(result.teacher_routines || {});
      if (tKeys.length > 0) setSelectedTeacherTab(tKeys[0]);

      // Persist generated routine and active inputs to localStorage so it restores on next login/refresh
      try {
        localStorage.setItem(ROUTINE_CACHE_KEY, JSON.stringify(result));
        localStorage.setItem(SEMESTERS_STATE_KEY, JSON.stringify(semesters));
        localStorage.setItem(TEACHERS_STATE_KEY, JSON.stringify(teachers));
        localStorage.setItem(SHIFT_STATE_KEY, selectedShift);
        localStorage.setItem(DAYS_STATE_KEY, JSON.stringify(selectedDays));
        localStorage.setItem(PERIODS_STATE_KEY, JSON.stringify(periods));
      } catch (e) {
        console.warn("Could not cache routine to local storage:", e);
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate routine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (!generatedRoutine?.timetable_id) return;
    downloadExportFile(generatedRoutine.timetable_id, "excel", `${campusInfo.routineTitle || "BCA_Routine"}.xlsx`);
  };

  const handleDownloadPdf = () => {
    if (!generatedRoutine?.timetable_id) return;
    downloadExportFile(generatedRoutine.timetable_id, "pdf", `${campusInfo.routineTitle || "BCA_Routine"}.pdf`);
  };

  const activeSemesters = semesters.filter(s => s.is_active);

  return (
    <div className="space-y-6">
      {/* Top Banner with Clean Neutral Styling */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                BCA Multi-Semester Routine Generator
              </h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                Clash-Free Multi-Semester
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Define faculty members with their abbreviation (e.g. <span className="font-semibold text-zinc-700 dark:text-zinc-300">[BRL]</span>), contact phone, and time windows. Updating campus name or address automatically syncs across the Live Routine Watch and export documents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/live-watch"
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span>Live Watch</span>
            </Link>
            <button
              type="button"
              onClick={handleCleanResetDatabase}
              disabled={resettingDb}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors"
              title="Delete all previous mock data and reset DB"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", resettingDb && "animate-spin")} />
              {resettingDb ? "Resetting..." : "Clean Reset DB"}
            </button>
            <button
              type="button"
              onClick={handleClearAllFields}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Clear Form
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-100 p-2.5 text-xs font-semibold text-zinc-900 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
            {resetMessage}
          </div>
        )}
      </div>

      {/* Routine Configuration Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        
        {/* Campus Header Configuration (Syncs everywhere in real-time) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-b border-zinc-100 pb-5 dark:border-zinc-800">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Campus / Institution Name
            </label>
            <input
              type="text"
              value={campusInfo.campusName}
              onChange={(e) => updateCampusInfo({ campusName: e.target.value })}
              placeholder="e.g. Ratna Rajyalaxmi Campus"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Campus Address / Location
            </label>
            <input
              type="text"
              value={campusInfo.campusAddress}
              onChange={(e) => updateCampusInfo({ campusAddress: e.target.value })}
              placeholder="e.g. Pradarshanimarga, Kathmandu Nepal"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
              Routine Title
            </label>
            <input
              type="text"
              value={campusInfo.routineTitle}
              onChange={(e) => updateCampusInfo({ routineTitle: e.target.value })}
              placeholder="e.g. BCA Academic Routine 2026"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Step 1: Faculty / Teachers Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-900">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Faculty Members, Abbreviation, Contact & Free-Time Windows
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Provide teacher abbreviation (e.g. [BRL]) and phone numbers for the campus directory sheet.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddTeacher}
              className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Teacher
            </button>
          </div>

          <div className="space-y-2">
            {teachers.map((t, idx) => {
              const assignedLoad = getTeacherAssignedCount(t.name);
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-1 gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40 sm:grid-cols-12 items-center"
                >
                  {/* Teacher Name: 3 cols */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                      Teacher Name ({idx + 1})
                    </label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => handleUpdateTeacher(t.id, "name", e.target.value)}
                      placeholder="e.g. Bhupendra Ram Luhar"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Abbreviation & Contact: 2 cols */}
                  <div className="sm:col-span-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                          Abbrev
                        </label>
                        <input
                          type="text"
                          value={t.abbreviation}
                          onChange={(e) => handleUpdateTeacher(t.id, "abbreviation", e.target.value.toUpperCase())}
                          placeholder="BRL"
                          maxLength={5}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-bold text-zinc-900 text-center uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                          Contact
                        </label>
                        <input
                          type="text"
                          value={t.contact}
                          onChange={(e) => handleUpdateTeacher(t.id, "contact", e.target.value)}
                          placeholder="9848811584"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speciality: 3 cols */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                      Subject Speciality / Skills
                    </label>
                    <input
                      type="text"
                      value={t.speciality}
                      onChange={(e) => handleUpdateTeacher(t.id, "speciality", e.target.value)}
                      placeholder="e.g. C, Java, Data Structures"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Available Time Interval: 3 cols */}
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                        Free Time Window
                      </label>
                      {assignedLoad > 0 && (
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                          {assignedLoad} hrs assigned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={t.free_time_start}
                        onChange={(e) => handleUpdateTeacher(t.id, "free_time_start", e.target.value)}
                        placeholder="06:30 AM"
                        className="w-1/2 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-center"
                      />
                      <span className="text-zinc-400 text-xs font-bold">&ndash;</span>
                      <input
                        type="text"
                        value={t.free_time_end}
                        onChange={(e) => handleUpdateTeacher(t.id, "free_time_end", e.target.value)}
                        placeholder="10:30 AM"
                        className="w-1/2 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 text-center"
                      />
                    </div>
                  </div>

                  {/* Delete: 1 col */}
                  <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(t.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
                      title="Delete Teacher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Running BCA Semesters Selection */}
        <div className="space-y-3">
          <div className="border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-900">
                2
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Select Running BCA Semesters
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose which semesters are currently active. All selected semesters will be scheduled together with zero teacher collisions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {semesters.map((sem) => (
              <button
                key={sem.semester_number}
                type="button"
                onClick={() => toggleSemester(sem.semester_number)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all text-center cursor-pointer",
                  sem.is_active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold dark:border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/50"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                <span className="text-xs font-bold">Sem {sem.semester_number}</span>
                <span className="text-[10px] opacity-80 mt-0.5 font-medium">
                  {sem.is_active ? `Active (${sem.subjects.length} sub)` : "Inactive"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Semester-Wise Subjects & Teacher Assignment */}
        <div className="space-y-4">
          <div className="border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-900">
                3
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Semester-Wise Subjects, Course Type (TH/PR/TU) & Teacher Assignment
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Add subjects under each running semester and specify Theory (TH), Practical (PR) or Tutorial (TU).
            </p>
          </div>

          {activeSemesters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No semesters selected. Please select one or more running BCA semesters in Step 2.
            </div>
          ) : (
            <div className="space-y-4">
              {activeSemesters.map((sem) => (
                <div
                  key={sem.semester_number}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {sem.semester_name}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        <span>Room:</span>
                        <input
                          type="text"
                          value={sem.room_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSemesters(semesters.map(s => s.semester_number === sem.semester_number ? { ...s, room_name: val } : s));
                          }}
                          placeholder="Room 101"
                          className="w-24 rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSubjectToSemester(sem.semester_number)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Subject to Sem {sem.semester_number}
                    </button>
                  </div>

                  {sem.subjects.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">
                      No subjects added yet. Click &quot;Add Subject&quot; above to add courses for {sem.semester_name}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sem.subjects.map((sub, sIdx) => {
                        const matchedTeacher = teachers.find(t => t.name === sub.teacher_name);
                        return (
                          <div
                            key={sub.id}
                            className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40 sm:grid-cols-12 items-center"
                          >
                            {/* Subject Name: 4 cols */}
                            <div className="sm:col-span-4">
                              <label className="block text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-0.5">
                                Subject Name ({sIdx + 1})
                              </label>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "name", e.target.value)}
                                placeholder="e.g. C Programming"
                                className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>

                            {/* Type (TH/PR/TU): 2 cols */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-0.5">
                                Type
                              </label>
                              <select
                                value={sub.course_type || "TH"}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "course_type", e.target.value as any)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                              >
                                <option value="TH">[LT/TH] Lecture / Theory</option>
                                <option value="PR">[PR] Practical / Lab</option>
                              </select>
                            </div>

                            {/* Weekly Periods: 2 cols */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-0.5 text-center">
                                Periods/Wk
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={sub.weekly_periods}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "weekly_periods", parseInt(e.target.value) || 1)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white text-center"
                              />
                            </div>

                            {/* Assigned Teacher: 3 cols */}
                            <div className="sm:col-span-3">
                              <label className="block text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-0.5">
                                Assigned Faculty
                              </label>
                              <select
                                value={sub.teacher_name}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "teacher_name", e.target.value)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                              >
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.name}>
                                    {t.name} [{t.abbreviation || autoAbbrev(t.name)}]
                                  </option>
                                ))}
                                {!teachers.some(t => t.name === sub.teacher_name) && (
                                  <option value={sub.teacher_name}>{sub.teacher_name}</option>
                                )}
                              </select>
                              {matchedTeacher && (
                                <span className="block text-[9px] text-zinc-500 truncate mt-0.5">
                                  {matchedTeacher.contact ? `Tel: ${matchedTeacher.contact}` : matchedTeacher.speciality}
                                </span>
                              )}
                            </div>

                            {/* Delete: 1 col */}
                            <div className="sm:col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(sem.semester_number, sub.id)}
                                className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 cursor-pointer"
                                title="Remove Subject"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Working Days, Shift Presets & Periods Configuration */}
        <div className="space-y-4">
          <div className="border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-900">
                4
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Shift &amp; Working Periods Configuration
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose your campus shift (Morning, Day, or Evening) or customize period slots. Classes are automatically packed consecutively with zero student idle gaps.
            </p>
          </div>

          {/* Shift Selector */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                Select Campus Shift:
              </label>
              <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                ✓ Zero Student Waiting Gaps
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleShiftSelect("morning")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                  selectedShift === "morning"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold dark:border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/50"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                <div>
                  <div className="text-xs font-black">🌅 Morning Shift</div>
                  <div className="text-[11px] opacity-80 mt-0.5">06:30 AM &ndash; 10:35 AM (5 Periods + Break)</div>
                </div>
                {selectedShift === "morning" && <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleShiftSelect("day")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                  selectedShift === "day"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold dark:border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/50"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                <div>
                  <div className="text-xs font-black">☀️ Day Shift</div>
                  <div className="text-[11px] opacity-80 mt-0.5">10:45 AM &ndash; 03:00 PM (5 Periods + Break)</div>
                </div>
                {selectedShift === "day" && <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleShiftSelect("evening")}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                  selectedShift === "evening"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold dark:border-emerald-500 dark:bg-emerald-950/70 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/50"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                <div>
                  <div className="text-xs font-black">🌙 Evening Shift</div>
                  <div className="text-[11px] opacity-80 mt-0.5">04:00 PM &ndash; 08:05 PM (5 Periods + Break)</div>
                </div>
                {selectedShift === "evening" && <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Active Days */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Active Working Days:
            </label>
            <div className="flex flex-wrap gap-2">
              {allAvailableDays.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white shadow-2xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periods Template */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {periods.map((p, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col justify-between rounded-lg border p-2 text-xs",
                  p.type === "Break"
                    ? "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-zinc-200 bg-zinc-50/70 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
                )}
              >
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                    {p.start_time} &ndash; {p.end_time}
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-60">
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculateRoutine}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 py-3.5 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
          {isGenerating ? "Calculating Clash-Free Schedule..." : "⚡ Generate BCA Multi-Semester Routine"}
        </button>
      </div>

      {/* Routine Display Section */}
      {generatedRoutine && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-5 print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  {generatedRoutine.name || campusInfo.routineTitle || "BCA College Timetable"}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-900 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                  <Check className="h-3 w-3" />
                  0 Conflicts (Clash-Free)
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Optimization Score: {generatedRoutine.score}% &bull; Total Scheduled Classes: {generatedRoutine.total_classes}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsLiveWatchOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer transition-colors shadow-xs"
              >
                <Eye className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                Live Watch Routine
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer shadow-xs transition-colors"
                title="Download Excel Routine (.xlsx)"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs transition-colors"
                title="Download PDF Routine (.pdf)"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* View Mode Controls: Campus Sheet vs Interactive Table vs Teacher Schedule */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800 print:hidden">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setActiveViewMode("sheet")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  activeViewMode === "sheet"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Campus Sheet Format
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  activeViewMode === "table"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Interactive Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode("teacher")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                  activeViewMode === "teacher"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                )}
              >
                <User className="h-3.5 w-3.5" />
                Faculty Schedules
              </button>
            </div>

            {/* Semester Filter Selector */}
            {activeViewMode !== "teacher" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Semester:
                </span>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(generatedRoutine.semester_routines || {}).map((secName) => (
                    <button
                      key={secName}
                      onClick={() => setSelectedSemesterTab(secName)}
                      className={cn(
                        "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        selectedSemesterTab === secName
                          ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/50 dark:bg-rose-600 dark:text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      {secName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Filter Selector */}
            {activeViewMode === "teacher" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Faculty:
                </span>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(generatedRoutine.teacher_routines || {}).map((tName) => (
                    <button
                      key={tName}
                      onClick={() => setSelectedTeacherTab(tName)}
                      className={cn(
                        "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                        selectedTeacherTab === tName
                          ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/50 dark:bg-rose-600 dark:text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      {tName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Render Active View Mode */}
          {activeViewMode === "sheet" && selectedSemesterTab && generatedRoutine.semester_routines[selectedSemesterTab] && (
            <div className="space-y-3">
              <CampusRoutineSheet
                campusName={generatedRoutine.campus_name || campusInfo.campusName}
                address={generatedRoutine.address || campusInfo.campusAddress}
                programName="Bachelors in Computer Applications (BCA)"
                semesterName={selectedSemesterTab.toUpperCase()}
                sectionName={generatedRoutine.semester_routines[selectedSemesterTab].section_name || "A"}
                roomNumber={generatedRoutine.semester_routines[selectedSemesterTab].room_number || "101"}
                title={generatedRoutine.name || campusInfo.routineTitle || "Daily Class Routine"}
                days={generatedRoutine.days || []}
                periods={generatedRoutine.periods || periods}
                entries={generatedRoutine.semester_routines[selectedSemesterTab].entries || []}
                teacherDirectory={generatedRoutine.semester_routines[selectedSemesterTab].teacher_directory || []}
                legend={generatedRoutine.legend || { "LT/TH": "Lecture / Theory", PR: "Practical / Lab" }}
              />
            </div>
          )}

          {activeViewMode === "table" && selectedSemesterTab && generatedRoutine.semester_routines[selectedSemesterTab] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Schedule Grid &mdash; {selectedSemesterTab} ({generatedRoutine.semester_routines[selectedSemesterTab].room_number})
                </h4>
                <span className="text-xs text-zinc-500">
                  Room: {generatedRoutine.semester_routines[selectedSemesterTab].room_number}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white dark:bg-zinc-800">
                      <th className="border border-zinc-800 p-2.5 font-bold w-24">Day</th>
                      {periods.map((p, idx) => (
                        <th key={idx} className="border border-zinc-800 p-2.5 font-bold min-w-[120px]">
                          {p.name}
                          <div className="text-[10px] font-normal opacity-80 mt-0.5">
                            {p.start_time} - {p.end_time}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedRoutine.days.map((day: any) => {
                      const dayActiveCount = dayPeriodCounts[day.name] || periods.length;
                      const secEntries = generatedRoutine.semester_routines[selectedSemesterTab].entries;

                      return (
                        <tr key={day.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="border border-zinc-200 bg-zinc-100 p-2.5 font-bold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                            {day.name}
                          </td>
                          {periods.map((p, pIdx) => {
                            if (pIdx >= dayActiveCount) {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 bg-zinc-100/50 p-2.5 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/30"
                                >
                                  -
                                </td>
                              );
                            }

                            if (p.type === "Break") {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 bg-zinc-100 p-2.5 font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300"
                                >
                                  [Interval]
                                </td>
                              );
                            }

                            const match = secEntries.find(
                              (e: any) => e.day_name === day.name && e.period_name === p.name
                            );

                            if (match) {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 p-2.5 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60"
                                >
                                  <div className="font-bold text-zinc-900 dark:text-white">
                                    {match.subject_name}
                                    {match.course_type && (
                                      <span className="ml-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                                        [{match.course_type}]
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                                    {match.teacher_name} {match.teacher_abbrev && `[${match.teacher_abbrev}]`}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {match.room_number}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={pIdx}
                                className="border border-zinc-200 p-2.5 text-zinc-400 dark:border-zinc-800"
                              >
                                -
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeViewMode === "teacher" && selectedTeacherTab && generatedRoutine.teacher_routines[selectedTeacherTab] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Faculty Schedule &mdash; {selectedTeacherTab}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Speciality: {generatedRoutine.teacher_routines[selectedTeacherTab].speciality} &bull; Free Time: {generatedRoutine.teacher_routines[selectedTeacherTab].free_time}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  Total Classes: {generatedRoutine.teacher_routines[selectedTeacherTab].entries.length} hrs
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white dark:bg-zinc-800">
                      <th className="border border-zinc-800 p-2.5 font-bold w-24">Day</th>
                      {periods.map((p, idx) => (
                        <th key={idx} className="border border-zinc-800 p-2.5 font-bold min-w-[120px]">
                          {p.name}
                          <div className="text-[10px] font-normal opacity-80 mt-0.5">
                            {p.start_time} - {p.end_time}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedRoutine.days.map((day: any) => {
                      const dayActiveCount = dayPeriodCounts[day.name] || periods.length;
                      const tEntries = generatedRoutine.teacher_routines[selectedTeacherTab].entries;

                      return (
                        <tr key={day.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="border border-zinc-200 bg-zinc-100 p-2.5 font-bold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                            {day.name}
                          </td>
                          {periods.map((p, pIdx) => {
                            if (pIdx >= dayActiveCount) {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 bg-zinc-100/50 p-2.5 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/30"
                                >
                                  -
                                </td>
                              );
                            }

                            if (p.type === "Break") {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 bg-zinc-100 p-2.5 font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300"
                                >
                                  [Interval]
                                </td>
                              );
                            }

                            const match = tEntries.find(
                              (e: any) => e.day_name === day.name && e.period_name === p.name
                            );

                            if (match) {
                              return (
                                <td
                                  key={pIdx}
                                  className="border border-zinc-200 p-2.5 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60"
                                >
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {match.subject_name}
                                  </div>
                                  <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                                    {match.section_name}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {match.room_number}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={pIdx}
                                className="border border-zinc-200 p-2.5 text-zinc-400 dark:border-zinc-800"
                              >
                                [Free]
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Watch Modal */}
      {generatedRoutine && (
        <LiveWatchModal
          isOpen={isLiveWatchOpen}
          onClose={() => setIsLiveWatchOpen(false)}
          timetable={{
            id: generatedRoutine.timetable_id,
            name: generatedRoutine.name || campusInfo.routineTitle,
            campus_name: generatedRoutine.campus_name || campusInfo.campusName,
            address: generatedRoutine.address || campusInfo.campusAddress,
            entries: Object.values(generatedRoutine.semester_routines || {}).flatMap((s: any) => s.entries || []),
            periods: generatedRoutine.periods || periods,
            teacher_directory: generatedRoutine.teacher_directory || [],
            legend: generatedRoutine.legend
          }}
          days={generatedRoutine.days || []}
          sections={Object.keys(generatedRoutine.semester_routines || {}).map((s, idx) => ({ id: s, name: s }))}
          teachers={teachers}
          initialSectionId={selectedSemesterTab}
        />
      )}
    </div>
  );
}
