import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableLoadingState
} from "@codexsun/ui/workspace/table";
import type { CompanyRecord } from "./company.types";

type SortKey = "code" | "company" | "industry" | "phone" | "status";

export function CompanyList({
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  records
}: {
  loading: boolean;
  onEdit: (record: CompanyRecord) => void;
  onForceDelete: (record: CompanyRecord) => void;
  onRestore: (record: CompanyRecord) => void;
  onSuspend: (record: CompanyRecord) => void;
  records: CompanyRecord[];
}) {
  const [sort, setSort] = useState<{ direction: "asc" | "desc"; key: SortKey }>({
    direction: "asc",
    key: "company"
  });
  const sortedRecords = useMemo(
    () =>
      [...records].sort((left, right) => {
        const difference = companySortValue(left, sort.key).localeCompare(
          companySortValue(right, sort.key),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
        return sort.direction === "asc" ? difference : -difference;
      }),
    [records, sort]
  );
  const toggleSort = (key: SortKey) =>
    setSort((current) => ({
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
      key
    }));

  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr>
              <WorkspaceTableHeaderCell className="w-16 text-center">#</WorkspaceTableHeaderCell>
              {(
                [
                  ["company", "Company"],
                  ["code", "Code"],
                  ["industry", "Industry"],
                  ["phone", "Phone"],
                  ["status", "Status"]
                ] as const
              ).map(([key, label]) => (
                <WorkspaceTableHeaderCell key={key}>
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort(key)}
                    type="button"
                  >
                    {label}
                    <SortIcon active={sort.key === key} direction={sort.direction} />
                  </button>
                </WorkspaceTableHeaderCell>
              ))}
              <WorkspaceTableHeaderCell className="text-right">Actions</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => {
              const locked = record.name.trim() === "-";
              return (
                <tr className="border-b last:border-0" key={record.id}>
                  <td className="px-4 py-3 text-center tabular-nums">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      className="font-medium hover:underline"
                      disabled={locked}
                      onClick={() => onEdit(record)}
                    >
                      {record.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{record.code}</td>
                  <td className="px-4 py-3">{record.industryName || "-"}</td>
                  <td className="px-4 py-3">{record.primaryPhone || "-"}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge
                      label={record.isActive ? "active" : "inactive"}
                      tone={record.isActive ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {locked ? (
                      <WorkspaceProtectedIndicator />
                    ) : (
                      <WorkspaceRowActions
                        actions={[
                          {
                            id: "force-delete",
                            label: "Force delete",
                            onSelect: () => onForceDelete(record),
                            tone: "destructive"
                          }
                        ]}
                        deleteLabel="Suspend"
                        isSuspended={!record.isActive}
                        onDelete={() => onSuspend(record)}
                        onEdit={() => onEdit(record)}
                        onRestore={() => onRestore(record)}
                        title={record.name}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && !records.length ? <WorkspaceTableLoadingState /> : null}
      {!loading && !records.length ? (
        <WorkspaceTableEmptyState>No companies found.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

function companySortValue(record: CompanyRecord, key: SortKey) {
  if (key === "company") return record.name;
  if (key === "industry") return record.industryName ?? "";
  if (key === "phone") return record.primaryPhone ?? "";
  if (key === "status") return record.isActive ? "active" : "inactive";
  return record.code;
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="size-3 text-muted-foreground" />;
  return direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}
