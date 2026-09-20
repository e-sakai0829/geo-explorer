/**
 * プロジェクト切り替えおよび非同期要求世代の管理ガード
 * 複数チャンネル（記事生成、履歴フェッチ、再スキャン等）の競合を分離し、
 * 旧プロジェクト・旧世代の遅延応答による画面・ステート汚染を防止する。
 */

export interface RequestSession {
  projectId: string;
  generationId: number;
  channel: string;
  signal: AbortSignal;
  isCurrent: () => boolean;
}

export class ProjectAsyncGuard {
  private activeProjectId: string | null = null;
  private channelGenerations: Map<string, number> = new Map();
  private channelControllers: Map<string, AbortController> = new Map();

  constructor(initialProjectId: string | null = null) {
    this.activeProjectId = initialProjectId;
  }

  /**
   * 現在のアクティブなプロジェクトIDを更新（切り替え時に呼ぶ）
   */
  public setProjectId(projectId: string | null): void {
    if (this.activeProjectId !== projectId) {
      this.activeProjectId = projectId;
      // プロジェクト切り替え時は全チャンネルの進行中通信を中断
      this.cancelAll();
    }
  }

  public getProjectId(): string | null {
    return this.activeProjectId;
  }

  /**
   * 非同期リクエストセッションを開始
   * プロジェクトが未指定または現在のアクティブプロジェクトと不一致の場合は null を返却
   */
  public start(channel: string, targetProjectId: string | null | undefined): RequestSession | null {
    if (!targetProjectId || targetProjectId !== this.activeProjectId) {
      return null;
    }

    // 既存の同チャンネル通信があればabortして世代を進める
    const prevController = this.channelControllers.get(channel);
    if (prevController) {
      try {
        prevController.abort();
      } catch {
        // ignore
      }
    }

    // 世代インクリメント
    const currentGen = (this.channelGenerations.get(channel) ?? 0) + 1;
    this.channelGenerations.set(channel, currentGen);

    const controller = new AbortController();
    this.channelControllers.set(channel, controller);

    return {
      projectId: targetProjectId,
      generationId: currentGen,
      channel,
      signal: controller.signal,
      isCurrent: () => {
        return (
          !controller.signal.aborted && this.activeProjectId === targetProjectId &&
          this.channelGenerations.get(channel) === currentGen
        );
      },
    };
  }

  /**
   * 特定チャンネルのキャンセル
   */
  public cancel(channel: string): void {
    const controller = this.channelControllers.get(channel);
    if (controller) {
      try {
        controller.abort();
      } catch {
        // ignore
      }
      this.channelControllers.delete(channel);
    }
    const currentGen = (this.channelGenerations.get(channel) ?? 0) + 1;
    this.channelGenerations.set(channel, currentGen);
  }

  /**
   * 全チャンネルのキャンセル（切替時・アンマウント時）
   */
  public cancelAll(): void {
    for (const [, controller] of this.channelControllers.entries()) {
      try {
        controller.abort();
      } catch {
        // ignore
      }
    }
    this.channelControllers.clear();

    for (const [channel] of this.channelGenerations.entries()) {
      const currentGen = (this.channelGenerations.get(channel) ?? 0) + 1;
      this.channelGenerations.set(channel, currentGen);
    }
  }

  /**
   * AbortError かどうかの安全な判定
   */
  public static isAbortError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as any;
    return e.name === "AbortError" || e.message === "The user aborted a request.";
  }
}
