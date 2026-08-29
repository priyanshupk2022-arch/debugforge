// Bug: Global unbounded array accumulates request objects with no eviction limit
const globalRequestStore: Array<{ id: string; timestamp: number }> = [];

export function handleIncomingRequest(reqId: string): { status: string; totalStored: number } {
  globalRequestStore.push({
    id: reqId,
    timestamp: Date.now(),
  });

  return { status: "ok", totalStored: globalRequestStore.length };
}

export function getCacheSize(): number {
  return globalRequestStore.length;
}

export function clearStore(): void {
  globalRequestStore.length = 0;
}
