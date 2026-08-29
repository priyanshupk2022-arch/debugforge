export interface User {
  id: string;
  name: string;
  tier: string;
}

// Simulated connection pool exhaustion bug
let activeConnections = 5;
const maxConnections = 5;

export const userService = {
  async findById(userId: string): Promise<User | undefined> {
    if (activeConnections >= maxConnections) {
      // Bug: Silently returns undefined when pool exhausted instead of throwing or queuing
      return undefined;
    }
    return { id: userId, name: "Alice", tier: "premium" };
  }
};
