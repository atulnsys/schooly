import React, { useMemo } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import GenericEntityDetailView from "./generic/GenericEntityDetailView";
import { getRegistryCatalogEntry } from "../lib/registryCatalog";
import {
  createRegistryExplorerEntityDefinition,
  getRegistryExplorerRow,
} from "../lib/registryExplorerEntityDefinition";

interface GenericRegistryDataPageProps {
  registryId: string;
  currentRole: string;
  onBackToExplorer: () => void;
}

function RegistryDetailFallback({
  row,
  currentRole,
  onBackToExplorer,
}: {
  row: NonNullable<ReturnType<typeof getRegistryExplorerRow>>;
  currentRole: string;
  onBackToExplorer: () => void;
}) {
  const definition = useMemo(() => {
    const baseDefinition = createRegistryExplorerEntityDefinition();
    return {
      ...baseDefinition,
      actions: [],
    };
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={onBackToExplorer}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to Registries
        </button>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
          Role: {currentRole}
        </span>
        {row.pageRoute && (
          <a
            href={row.pageRoute}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
          >
            Open first-class page <ExternalLink size={12} />
          </a>
        )}
      </div>

      <GenericEntityDetailView
        definition={definition}
        row={row}
        onClearSelection={onBackToExplorer}
        childrenAfterSections={
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Universal registry route</p>
            <p>
              This route exposes the registry metadata directly. Live row rendering stays on the existing first-class page when one is already available.
            </p>
          </div>
        }
      />
    </div>
  );
}

export default function GenericRegistryDataPage({
  registryId,
  currentRole,
  onBackToExplorer,
}: GenericRegistryDataPageProps) {
  const row = useMemo(() => getRegistryExplorerRow(registryId), [registryId]);
  const catalogEntry = useMemo(() => getRegistryCatalogEntry(registryId), [registryId]);

  if (catalogEntry?.createEntityDefinition && catalogEntry.firstClassPageEnabled) {
    return null;
  }

  if (!row) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1.5">
        <div className="font-extrabold">Source unavailable</div>
        <div>
          Registry "{registryId}" is not mapped in the registry explorer catalog yet.
        </div>
        <div className="text-[11px] text-amber-700">
          If this registry exists in the master capability catalog, it still needs source mapping before live rows can render here.
        </div>
      </div>
    );
  }

  return <RegistryDetailFallback row={row} currentRole={currentRole} onBackToExplorer={onBackToExplorer} />;
}
