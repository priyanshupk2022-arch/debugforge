// src/index.js (Patched by DebugForge with Async Mutex)
let counter = 0;
let lockQueue = Promise.resolve();

function withLock(fn) {
  let release;
  const nextLock = new Promise(resolve => { release = resolve; });
  const currentLock = lockQueue;
  lockQueue = currentLock.then(() => nextLock);

  return currentLock.then(async () => {
    try {
      return await fn();
    } finally {
      release();
    }
  });
}

export async function incrementCounter() {
  return await withLock(async () => {
    const current = counter;
    await new Promise(r => setTimeout(r, 2));
    counter = current + 1;
    return counter;
  });
}

export function getCounter() {
  return counter;
}

export function resetCounter() {
  counter = 0;
}
