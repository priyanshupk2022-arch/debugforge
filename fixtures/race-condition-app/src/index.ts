let counter = 0;

// Bug: Unsynchronized asynchronous read-modify-write operation
export async function incrementCounter(): Promise<number> {
  const current = counter;
  await new Promise(r => setTimeout(r, 5)); // Simulates IO/DB latency
  counter = current + 1;
  return counter;
}

export function getCounter(): number {
  return counter;
}

export function resetCounter(): void {
  counter = 0;
}
