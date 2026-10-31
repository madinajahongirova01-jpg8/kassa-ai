const API_URL = (process.env.KASSA_API_URL ?? 'https://kassa-ai-api.onrender.com').replace(/\/+$/, '');
const BUSINESS_TIME_ZONE = 'Asia/Dushanbe';
const WAKE_ATTEMPTS = 12;
const WAKE_DELAY_MS = 10_000;
const REQUEST_TIMEOUT_MS = 70_000;

type Kind = 'INCOME' | 'EXPENSE';
type Category = 'SALE' | 'GOODS' | 'SALARY' | 'UTILITIES' | 'TRANSPORT' | 'RENT' | 'OTHER';

interface SeedEntry {
  daysAgo: number;
  kind: Kind;
  category: Category;
  amount: string;
  title: string;
}

interface SeedPayment {
  daysAgo: number;
  amount: string;
}

interface SeedCustomer {
  name: string;
  phone: string;
  note?: string;
  debt: { amount: string; description: string; daysAgo: number; dueInDays: number };
  payment?: SeedPayment;
}

interface CreatedRecord {
  id: string;
}

class SeedError extends Error {}

const ENTRIES: SeedEntry[] = [
  { daysAgo: 6, kind: 'INCOME', category: 'SALE', amount: '1450', title: 'Фурӯш' },
  { daysAgo: 6, kind: 'EXPENSE', category: 'GOODS', amount: '640', title: 'Орд, 2 халта' },
  { daysAgo: 5, kind: 'INCOME', category: 'SALE', amount: '1680', title: 'Фурӯш' },
  { daysAgo: 5, kind: 'EXPENSE', category: 'TRANSPORT', amount: '35', title: 'Такси' },
  { daysAgo: 4, kind: 'INCOME', category: 'SALE', amount: '1320', title: 'Фурӯш' },
  { daysAgo: 4, kind: 'EXPENSE', category: 'GOODS', amount: '480', title: 'Шакар, 1 халта' },
  { daysAgo: 3, kind: 'INCOME', category: 'SALE', amount: '1900', title: 'Фурӯш' },
  { daysAgo: 3, kind: 'EXPENSE', category: 'GOODS', amount: '260', title: 'Равған, 10 литр' },
  { daysAgo: 2, kind: 'INCOME', category: 'SALE', amount: '1550', title: 'Фурӯш' },
  { daysAgo: 2, kind: 'EXPENSE', category: 'SALARY', amount: '600', title: 'Музди коргар' },
  { daysAgo: 1, kind: 'INCOME', category: 'SALE', amount: '1740', title: 'Фурӯш' },
  { daysAgo: 1, kind: 'EXPENSE', category: 'RENT', amount: '2500', title: 'Иҷораи дӯкон' },
  { daysAgo: 0, kind: 'INCOME', category: 'SALE', amount: '980', title: 'Фурӯш' },
  { daysAgo: 0, kind: 'EXPENSE', category: 'TRANSPORT', amount: '30', title: 'Такси' },
];

const CUSTOMERS: SeedCustomer[] = [
  {
    name: 'Фирӯза Раҳимова',
    phone: '+992 93 512 47 80',
    note: 'Ҳамсоя, хонаи 12',
    debt: { amount: '450', description: 'Орд 1 халта ва равған', daysAgo: 20, dueInDays: -6 },
  },
  {
    name: 'Бахтиёр Назаров',
    phone: '+992 90 734 21 56',
    debt: { amount: '320', description: 'Шакар ва чой', daysAgo: 3, dueInDays: 2 },
  },
  {
    name: 'Нигина Каримова',
    phone: '+992 92 845 63 19',
    debt: { amount: '600', description: 'Маводи хӯрокворӣ барои тӯй', daysAgo: 10, dueInDays: 10 },
    payment: { daysAgo: 2, amount: '250' },
  },
  {
    name: 'Сӯҳроб Аминов',
    phone: '+992 98 216 07 43',
    debt: { amount: '280', description: 'Равған 5 литр', daysAgo: 8, dueInDays: 7 },
    payment: { daysAgo: 1, amount: '280' },
  },
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SeedError(`Set ${name} before running the script.`);
  return value;
}

function todayInBusinessTimeZone(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE }).format(new Date());
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(method: 'GET' | 'POST', path: string, token?: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const details = typeof data === 'object' && data !== null && 'details' in data ? JSON.stringify(data.details) : '';
    throw new SeedError(`${method} ${path} failed with ${response.status} ${details}`.trim());
  }
  return data as T;
}

async function wakeApi(): Promise<void> {
  for (let attempt = 1; attempt <= WAKE_ATTEMPTS; attempt += 1) {
    try {
      await request<unknown>('GET', '/health');
      console.log('API is awake.');
      return;
    } catch {
      console.log(`Waking the API (${attempt}/${WAKE_ATTEMPTS})...`);
      await sleep(WAKE_DELAY_MS);
    }
  }
  throw new SeedError('The API did not wake up. Try again in a minute.');
}

async function login(email: string, password: string): Promise<string> {
  const result = await request<{ accessToken?: unknown }>('POST', '/auth/login', undefined, { email, password });
  if (typeof result.accessToken !== 'string') throw new SeedError('Login did not return a token.');
  console.log('Signed in.');
  return result.accessToken;
}

async function ensureEmptyAccount(token: string): Promise<void> {
  const customers = await request<unknown[]>('GET', '/customers', token);
  const entries = await request<{ items: unknown[] }>('GET', '/cash-entries?limit=1', token);
  if (customers.length > 0 || entries.items.length > 0) {
    throw new SeedError(
      `The account already has data (${customers.length} customers, ${entries.items.length > 0 ? 'some' : 'no'} cash entries). Nothing was added, so no duplicates were created.`,
    );
  }
}

async function seedEntries(token: string, today: string): Promise<void> {
  const entries = ENTRIES.map((entry) => ({
    kind: entry.kind,
    category: entry.category,
    amount: entry.amount,
    title: entry.title,
    occurredOn: shiftDate(today, -entry.daysAgo),
    source: 'TEXT',
  }));
  await request<unknown>('POST', '/cash-entries', token, { entries });
  console.log(`Added ${entries.length} cash entries.`);
}

async function seedCustomers(token: string, today: string): Promise<void> {
  for (const customer of CUSTOMERS) {
    const created = await request<CreatedRecord>('POST', '/customers', token, {
      name: customer.name,
      phone: customer.phone,
      ...(customer.note ? { note: customer.note } : {}),
    });
    const occurredOn = shiftDate(today, -customer.debt.daysAgo);
    const debt = await request<CreatedRecord>('POST', `/customers/${created.id}/debts`, token, {
      amount: customer.debt.amount,
      description: customer.debt.description,
      occurredOn,
      dueOn: shiftDate(today, customer.debt.dueInDays),
    });
    if (customer.payment) {
      await request<unknown>('POST', `/debts/${debt.id}/payments`, token, {
        amount: customer.payment.amount,
        paidOn: shiftDate(today, -customer.payment.daysAgo),
      });
    }
    console.log(`Added customer ${customer.name}.`);
  }
}

async function main(): Promise<void> {
  const email = requireEnv('DEMO_EMAIL');
  const password = requireEnv('DEMO_PASSWORD');
  await wakeApi();
  const token = await login(email, password);
  await ensureEmptyAccount(token);
  const today = todayInBusinessTimeZone();
  await seedEntries(token, today);
  await seedCustomers(token, today);
  console.log('Demo data is ready.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unexpected error while adding demo data.');
  process.exitCode = 1;
});
