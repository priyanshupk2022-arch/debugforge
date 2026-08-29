// src/index.js (Patched by DebugForge with Bounded Ring Buffer)
class RingBuffer {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.buffer = [];
  }

  push(item) {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift(); // Evict oldest entry
    }
    this.buffer.push(item);
  }

  size() {
    return this.buffer.length;
  }

  clear() {
    this.buffer.length = 0;
  }
}

const globalRequestStore = new RingBuffer(50);

export function handleIncomingRequest(reqId) {
  globalRequestStore.push({
    id: reqId,
    timestamp: Date.now()
  });

  return { status: "ok", totalStored: globalRequestStore.size() };
}

export function getCacheSize() {
  return globalRequestStore.size();
}

export function clearStore() {
  globalRequestStore.clear();
}
