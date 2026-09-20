/**
 * プロジェクト単位での下書き管理・手動編集保護ストレージ
 * LocalStorage例外安全、所属プロジェクト検証、不正要素除外を提供。
 */

export interface EditorDraft {
  projectId: string;
  prompt: string;
  article: string;
  targetLanguage: "ja" | "zh-TW" | "en";
  brandName?: string;
  fanoutQueries?: string[];
  lastModifiedAt: number;
}

const DRAFT_PREFIX = "geo_editor_draft_";
// Keep unsaved work during same-tab navigation when persistent storage fails.
const memory = new Map<string, EditorDraft>();
const unsaved = new Set<string>();
export function isDraftUnsaved(scope: string): boolean { return unsaved.has(getDraftStorageKey(scope) || ""); }

export function getDraftStorageKey(projectId: string | null | undefined): string | null {
  if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
    return null;
  }
  return `${DRAFT_PREFIX}${projectId.trim()}`;
}

/**
 * プロジェクトIDに紐づく下書きを取得。
 * 不正な所属やデータ破損時は null を返し、安全にフォールバックする。
 */
export function loadEditorDraft(projectId: string | null | undefined): EditorDraft | null {
  const key = getDraftStorageKey(projectId);
  if (!key || !projectId) return null;

  if (memory.has(key)) return memory.get(key)!;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    // 所属検証: 保存されているprojectIdが要求先と厳格に一致しない場合は破棄
    if (parsed.projectId !== projectId) return null;

    return {
      projectId,
      prompt: typeof parsed.prompt === "string" ? parsed.prompt : "",
      article: typeof parsed.article === "string" ? parsed.article : "",
      targetLanguage: parsed.targetLanguage === "zh-TW" || parsed.targetLanguage === "en" ? parsed.targetLanguage : "ja",
      brandName: typeof parsed.brandName === "string" ? parsed.brandName : undefined,
      fanoutQueries: Array.isArray(parsed.fanoutQueries) ? parsed.fanoutQueries.filter((q: any) => typeof q === "string") : [],
      lastModifiedAt: typeof parsed.lastModifiedAt === "number" && Number.isFinite(parsed.lastModifiedAt) ? parsed.lastModifiedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * プロジェクトIDに紐づく下書きを保存。
 * 容量超過やストレージ無効時もクラッシュせず false を返す。
 */
export function saveEditorDraft(
  projectId: string | null | undefined,
  draft: {
    prompt: string;
    article: string;
    targetLanguage?: "ja" | "zh-TW" | "en";
    brandName?: string;
    fanoutQueries?: string[];
    lastModifiedAt?: number;
  }
): boolean {
  const key = getDraftStorageKey(projectId);
  if (!key || !projectId) return false;

  try {
    const payload: EditorDraft = {
      projectId,
      prompt: draft.prompt || "",
      article: draft.article || "",
      targetLanguage: draft.targetLanguage || "ja",
      brandName: draft.brandName,
      fanoutQueries: draft.fanoutQueries || [],
      lastModifiedAt: typeof draft.lastModifiedAt === "number" && Number.isFinite(draft.lastModifiedAt) ? draft.lastModifiedAt : Date.now(),
    };
    if (typeof window === "undefined") return false;
    memory.set(key, payload);
    unsaved.add(key);
    localStorage.setItem(key, JSON.stringify(payload));
    unsaved.delete(key);
    memory.delete(key);
    return true;
  } catch {
    // QuotaExceededError や Storage無効時もクラッシュさせない
    return false;
  }
}

/**
 * プロジェクトIDに紐づく下書きを削除
 */
export function clearEditorDraft(projectId: string | null | undefined): void {
  const key = getDraftStorageKey(projectId);
  if (!key) return;
  memory.delete(key); unsaved.delete(key);
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
