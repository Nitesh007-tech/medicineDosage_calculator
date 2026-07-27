import {
  users,
  calculations,
  type User,
  type InsertUser,
  type Calculation,
  type InsertCalculation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User | undefined>;
  getCalculations(): Promise<Calculation[]>;
  createCalculation(entry: InsertCalculation): Promise<Calculation | undefined>;
  clearCalculations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async createUser(user: InsertUser): Promise<User | undefined> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async getCalculations(): Promise<Calculation[]> {
    return await db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.createdAt))
      .limit(50);
  }

  async createCalculation(
    entry: InsertCalculation
  ): Promise<Calculation | undefined> {
    const [created] = await db.insert(calculations).values(entry).returning();
    return created;
  }

  async clearCalculations(): Promise<void> {
    await db.delete(calculations);
  }
}

export const storage = new DatabaseStorage();