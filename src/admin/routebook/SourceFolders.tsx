import { useSearchParams } from "react-router-dom";
import { Folder } from "lucide-react";
import type { Row } from "./logic.js";
import { SOURCE_LABEL, sourceFolderOf, validFolder, type FolderFilter } from "./sources.js";
export function useSourceFolder() {
  const [params, setParams] = useSearchParams();
  const folder = validFolder(params.get("folder"));
  const setFolder = (value: FolderFilter) => {
    const next = new URLSearchParams(params);
    if (value === "ALL") next.delete("folder"); else next.set("folder", value);
    setParams(next, { replace: true });
  };
  return { folder, setFolder };
}
export function SourceFolders({ rows, folder, onChange }: { rows: Row[]; folder: FolderFilter; onChange: (v: FolderFilter) => void }) {
  const live = rows.filter(r => !r.m?.removed && !r.m?.dupOf);
  const items = [["ALL", "All sources"], ...Object.entries(SOURCE_LABEL)] as [FolderFilter, string][];
  return <nav className="rb-source-folders" aria-label="Lead source folders">{items.map(([key,label]) =>
    <button type="button" key={key} aria-pressed={folder === key} onClick={() => onChange(key)} data-testid={`source-folder-${key}`}>
      <Folder size={16} /><span>{label}</span><b>{live.filter(r => key === "ALL" || sourceFolderOf(r.s,r.m) === key).length}</b>
    </button>)}<p>Source stays with a company through visits, leads and orders.</p></nav>;
}
