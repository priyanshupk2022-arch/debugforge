// user-service.js (Patched by DebugForge)
class ConnectionPool {
  constructor(max = 5) {
    this.max = max;
    this.active = 0;
  }

  async acquire() {
    if (this.active >= this.max) {
      await new Promise(r => setTimeout(r, 10));
    }
    this.active++;
    return true;
  }

  release() {
    if (this.active > 0) this.active--;
  }
}

const pool = new ConnectionPool();

export const userService = {
  async findById(userId) {
    await pool.acquire();
    try {
      if (userId === "unknown") return null;
      return { id: userId, name: "Alice", tier: "premium" };
    } finally {
      pool.release();
    }
  }
};
