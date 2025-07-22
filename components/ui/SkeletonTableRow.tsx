"use client";

import React from "react";

interface SkeletonTableRowProps {
  columns: number;
}

export function SkeletonTableRow({ columns }: SkeletonTableRowProps) {
  return (
    <tr className="w-full border-b border-slate-100">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );
}
