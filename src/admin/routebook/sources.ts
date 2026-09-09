import type { RbStop, RbMark, SourceFolder } from "./types.js";
export const SOURCE_LABEL: Record<SourceFolder, string> = { GPT: "GPT Leads", CLAUDE: "Claude Leads", TEAM: "Team Leads", UNKNOWN: "Unassigned" };
export function sourceFolderOf(s: RbStop, m?: RbMark): SourceFolder {
  if (m?.sourceFolder && Object.prototype.hasOwnProperty.call(SOURCE_LABEL, m.sourceFolder)) return m.sourceFolder;
  if (s.tags?.some(t => t.t === "GPT Leads")) return "GPT";
  if (s.tags?.some(t => t.t === "Claude Leads")) return "CLAUDE";
  // The original shipped register was researched in Claude. Road additions
  // have no proven AI provenance and must not be silently credited to Claude.
  return s.userAdded ? "TEAM" : "CLAUDE";
}
export type FolderFilter = SourceFolder | "ALL";
export const validFolder = (v: string | null): FolderFilter => v && Object.prototype.hasOwnProperty.call(SOURCE_LABEL, v) ? v as SourceFolder : "ALL";
