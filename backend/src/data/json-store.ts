import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

/**
 * Generic JSON file-based store for persisting data
 * Handles reading, writing, and basic CRUD operations
 */
export class JsonStore<T extends { id: string | number }> {
  private filePath: string;
  private cache: T[] = [];
  private lastModified: number = 0;

  constructor(filename: string) {
    this.filePath = path.join(DATA_DIR, `${filename}.json`);
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Read file from disk and parse JSON
   */
  private async readFile(): Promise<T[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      throw new Error(`Failed to read ${this.filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Write data to file as JSON
   */
  private async writeFile(data: T[]): Promise<void> {
    await this.ensureDirectory();
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(this.filePath, json, 'utf-8');
    this.lastModified = Date.now();
  }

  /**
   * Load data from file (with caching)
   */
  async load(): Promise<T[]> {
    try {
      const stat = await fs.stat(this.filePath);
      // Use cache if file hasn't changed
      if (stat.mtimeMs <= this.lastModified && this.cache.length > 0) {
        return this.cache;
      }
      this.cache = await this.readFile();
      this.lastModified = stat.mtimeMs;
      return this.cache;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get all items
   */
  async all(): Promise<T[]> {
    return this.load();
  }

  /**
   * Find item by id
   */
  async findById(id: string | number): Promise<T | null> {
    const data = await this.load();
    return data.find((item) => item.id === id) || null;
  }

  /**
   * Find first item matching predicate
   */
  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const data = await this.load();
    return data.find(predicate) || null;
  }

  /**
   * Find all items matching predicate
   */
  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const data = await this.load();
    return data.filter(predicate);
  }

  /**
   * Insert new item
   */
  async insert(item: T): Promise<T> {
    const data = await this.load();
    data.push(item);
    await this.writeFile(data);
    return item;
  }

  /**
   * Insert multiple items
   */
  async insertMany(items: T[]): Promise<T[]> {
    const data = await this.load();
    data.push(...items);
    await this.writeFile(data);
    return items;
  }

  /**
   * Update item
   */
  async update(id: string | number, updates: Partial<T>): Promise<T | null> {
    const data = await this.load();
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = { ...data[index], ...updates };
    data[index] = updated;
    await this.writeFile(data);
    return updated;
  }

  /**
   * Delete item
   */
  async delete(id: string | number): Promise<boolean> {
    const data = await this.load();
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) return false;

    data.splice(index, 1);
    await this.writeFile(data);
    return true;
  }

  /**
   * Replace entire data set
   */
  async replaceAll(items: T[]): Promise<void> {
    await this.writeFile(items);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    await this.writeFile([]);
  }
}
