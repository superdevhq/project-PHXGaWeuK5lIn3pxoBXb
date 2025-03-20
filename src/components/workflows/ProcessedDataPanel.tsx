
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedDataTable } from "./ProcessedDataTable";

export function ProcessedDataPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Processed Data</h2>
      </div>
      
      <ProcessedDataTable />
    </div>
  );
}
