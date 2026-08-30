// Minimal ambient types for node:sqlite (experimental, not yet in @types/node).
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path?: string);
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }
  export interface Statement {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
}
