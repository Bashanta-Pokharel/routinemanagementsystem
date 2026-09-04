"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SimpleRoutineWizard } from "@/components/SimpleRoutineWizard";

export default function SimpleBuilderPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SimpleRoutineWizard />
      </div>
    </DashboardLayout>
  );
}
