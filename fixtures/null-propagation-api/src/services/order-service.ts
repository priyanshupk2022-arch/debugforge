// order-service.ts (Patched by DebugForge)
import { userService } from "./user-service.js";

export const orderService = {
  async processOrder(userId, amount) {
    const user = await userService.findById(userId);

    // Fixed: Defensive validation prevents undefined .id dereference
    if (!user) {
      throw new Error(`UserNotFoundError: Cannot process order for invalid userId: ${userId}`);
    }

    return {
      id: "ord_101",
      userId: user.id,
      amount,
      status: "processed"
    };
  }
};
