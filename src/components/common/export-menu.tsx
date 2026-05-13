"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function ExportMenu({
  onCsv,
  label = "Export"
}: {
  onCsv: () => void;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onCsv()}>
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            if (typeof window !== "undefined") window.print();
          }}
        >
          <Printer className="h-4 w-4" />
          Export PDF (Print)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
