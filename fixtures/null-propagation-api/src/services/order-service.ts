import { userService } from "./user-service.js";

export interface Order {
  id: string;
  userId: string;
  amount: number;
  status: string;
}

export const orderService = {
  async processOrder(userId: string, amount: number): Promise<Order> {
    const user = await userService.findById(userId);

    // Bug: Accesses user.id without checking if user is undefined
    return {
      id: "ord_101",
      userId: user.id, // CRASH SITE: TypeError: Cannot read properties of undefined (reading 'id')
      amount,
      status: "processed"
    };
  }
};
