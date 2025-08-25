import { of, delay } from 'rxjs';
import type { NgxServerFetcher, NgxPageRequest, NgxPageResult } from './../../../ngx-grid/src/public-api';

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  age: number;
  salary: number;
  joinDate: Date;
  active: boolean;
  department: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Finance' | 'HR' | 'Support';
  country: 'Brazil' | 'USA' | 'Canada' | 'Germany' | 'UK' | 'Spain' | 'France' | 'Australia' | 'Japan' | 'India';
  score: number;
}

// Seeded RNG (deterministic)
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'Lucas', 'Mariana', 'Pedro', 'Ana', 'João', 'Carla', 'Bruno', 'Julia', 'Rafael', 'Bianca',
  'Gabriel', 'Fernanda', 'Matheus', 'Beatriz', 'Felipe', 'Camila', 'Thiago', 'Larissa', 'Diego', 'Aline'
] as const;

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rodrigues', 'Gomes',
  'Barbosa', 'Carvalho', 'Araujo', 'Ribeiro', 'Teixeira', 'Correia', 'Melo', 'Castro', 'Nunes', 'Lima'
] as const;

const DEPARTMENTS: DemoUser['department'][] = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Support'
];

const COUNTRIES: DemoUser['country'][] = [
  'Brazil', 'USA', 'Canada', 'Germany', 'UK', 'Spain', 'France', 'Australia', 'Japan', 'India'
];

const DOMAINS = ['example.com', 'mail.com', 'corp.local', 'company.io', 'workspace.dev'];

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function randomInt(rnd: () => number, min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
function randomFloat(rnd: () => number, min: number, max: number, decimals = 2): number {
  const n = rnd() * (max - min) + min;
  return +n.toFixed(decimals);
}
function randomDateInPastYears(rnd: () => number, years = 5): Date {
  const now = Date.now();
  const past = now - years * 365 * 24 * 60 * 60 * 1000;
  const time = Math.floor(rnd() * (now - past)) + past;
  return new Date(time);
}

export function generateUsers(count: number, seed = 'ngx-grid-demo'): DemoUser[] {
  const rnd = mulberry32(hashSeed(seed));
  const users: DemoUser[] = [];

  for (let i = 1; i <= count; i++) {
    const first = pick(rnd, FIRST_NAMES);
    const last = pick(rnd, LAST_NAMES);
    const name = `${first} ${last}`;
    const dept = pick(rnd, DEPARTMENTS);
    const country = pick(rnd, COUNTRIES);
    const age = randomInt(rnd, 18, 65);

    // Salary baseline by department + small spread
    const baseByDept: Record<DemoUser['department'], [number, number]> = {
      Engineering: [9000, 18000],
      Design: [6000, 12000],
      Marketing: [5500, 11000],
      Sales: [5000, 15000],
      Finance: [7000, 14000],
      HR: [5000, 10000],
      Support: [4000, 9000],
    };
    const [minSal, maxSal] = baseByDept[dept];
    const salary = Math.round(randomFloat(rnd, minSal, maxSal) / 100) * 100;

    const emailLocal = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    const email = `${emailLocal}${i % 7 === 0 ? '.' + (i % 100) : ''}@${pick(rnd, DOMAINS)}`;

    users.push({
      id: i,
      name,
      email,
      age,
      salary,
      joinDate: randomDateInPastYears(rnd, 6),
      active: rnd() > 0.2,
      department: dept,
      country,
      score: randomFloat(rnd, 0, 100, 1),
    });
  }

  return users;
}

// Utilitário para server-side demo: aplica sort + paginação no array
function getValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function defaultCompare(a: any, b: any): number {
  const an = a == null;
  const bn = b == null;
  if (an && bn) return 0;
  if (an) return 1;
  if (bn) return -1;

  if (a instanceof Date || b instanceof Date) {
    const ta = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const tb = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return ta - tb;
  }
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function makeServerFetcher<T extends Record<string, any>>(allRows: T[], latencyMs = 350): NgxServerFetcher<T> {
  return (req: NgxPageRequest) => {
    const sorters = req.sortModel ?? [];
    let rows = allRows.slice();

    if (sorters.length) {
      rows.sort((ra, rb) => {
        for (const s of sorters) {
          const va = getValue(ra, s.colId.toString());
          const vb = getValue(rb, s.colId.toString());
          const cmp = defaultCompare(va, vb);
          if (cmp !== 0) return s.sort === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    const start = req.pageIndex * req.pageSize;
    const page = rows.slice(start, start + req.pageSize);

    const result: NgxPageResult<T> = { rows: page, total: allRows.length };
    return of(result).pipe(delay(latencyMs));
  };
}

// Dados prontos para usar
export const DEMO_USERS: DemoUser[] = generateUsers(1000, 'ngx-grid-demo-seed');

// Exemplo de fetcher server-side (opcional)
export const demoServerFetcher: NgxServerFetcher<DemoUser> = makeServerFetcher(DEMO_USERS, 400);
