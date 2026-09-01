import {
  users,
  calculations,
  type User,
  type InsertUser,
  type Calculation,
  type InsertCalculation,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User | undefined>;
  getCalculations(): Promise<Calculation[]>;
  createCalculation(entry: InsertCalculation): Promise<Calculation | undefined>;
  clearCalculations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllUsers(): Promise<User[]> {
    if (!db) return [];
    const result = await db.select().from(users);
    return result;
  }

  async createUser(user: InsertUser): Promise<User | undefined> {
    if (!db) return undefined;
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async getCalculations(): Promise<Calculation[]> {
    if (!db) return [];
    return await db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.createdAt))
      .limit(50);
  }

  async createCalculation(
    entry: InsertCalculation
  ): Promise<Calculation | undefined> {
    if (!db) return undefined;
    const [created] = await db.insert(calculations).values(entry).returning();
    return created;
  }

  async clearCalculations(): Promise<void> {
    if (!db) return;
    await db.delete(calculations);
  }
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private calculations: Calculation[] = [];
  private userIdCounter = 1;

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async createUser(user: InsertUser): Promise<User | undefined> {
    const newUser: User = {
      ...user,
      id: this.userIdCounter++,
      createdAt: new Date(),
    } as User;
    this.users.push(newUser);
    return newUser;
  }

  async getCalculations(): Promise<Calculation[]> {
    return [...this.calculations]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 50);
  }

  async createCalculation(
    entry: InsertCalculation
  ): Promise<Calculation | undefined> {
    const calc: Calculation = {
      ...entry,
      id: nanoid(),  // ✅ Generate UUID-like string instead of number
      createdAt: new Date(),
    } as Calculation;
    this.calculations.push(calc);
    return calc;
  }

  async clearCalculations(): Promise<void> {
    this.calculations = [];
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
