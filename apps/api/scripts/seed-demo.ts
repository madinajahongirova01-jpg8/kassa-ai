const DEFAULT_API_URL = 'https://kassa-ai-api.onrender.com';
const API_URL = (process.env.DEMO_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
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

class SeedError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

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
  const value = process.env[name];
  if (value === undefined || value.trim() === '') throw new SeedError(`Set ${name} before running the script.`);
  return value;
}

function maskEmail(email: string): string {
  const [name = '', domain = ''] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

function apiMessage(data: unknown): string {
  if (typeof data !== 'object' || data === null) return '';
  const message = 'message' in data && typeof data.message === 'string' ? data.message : '';
  const details: unknown[] = 'details' in data && Array.isArray(data.details) ? data.details : [];
  return [message, ...details.filter((item): item is string => typeof item === 'string')].filter(Boolean).join('; ');
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
    const message = apiMessage(data);
    throw new SeedError(`${method} ${API_URL}${path} failed with ${response.status}${message ? `: ${message}` : ''}`, response.status);
  }
  return data as T;
}

async function wakeApi(): Promise<void> {
  let lastError = '';
  for (let attempt = 1; attempt <= WAKE_ATTEMPTS; attempt += 1) {
    try {
      await request<unknown>('GET', '/health');
      console.log('API is awake.');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'unknown error';
      console.log(`Waking the API at ${API_URL} (${attempt}/${WAKE_ATTEMPTS})...`);
      await sleep(WAKE_DELAY_MS);
    }
  }
  throw new SeedError(`The API at ${API_URL} did not answer on /health (${lastError}). Check DEMO_API_URL or try again in a minute.`);
}

async function login(email: string, password: string): Promise<string> {
  let result: { accessToken?: unknown };
  try {
    result = await request<{ accessToken?: unknown }>('POST', '/auth/login', undefined, { email, password });
  } catch (error) {
    if (error instanceof SeedError && error.status === 401) {
      throw new SeedError(
        [
          error.message,
          `The API at ${API_URL} did not accept this email and password.`,
          '- Check that DEMO_API_URL points to the API where this account was created (default: the live API on Render).',
          '- Put the password in single quotes so the shell does not change characters such as $, ` or !.',
          '- Make sure the password has no extra spaces at the start or the end.',
        ].join('\n'),
        401,
      );
    }
    throw error;
  }
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
  const email = requireEnv('DEMO_EMAIL').trim().toLowerCase();
  const password = requireEnv('DEMO_PASSWORD');
  console.log(`API: ${API_URL}${API_URL === DEFAULT_API_URL ? ' (default)' : ' (from DEMO_API_URL)'}`);
  console.log(`Email: ${maskEmail(email)}`);
  console.log(`Password: set, ${password.length} characters${password.trim() === password ? '' : ', has spaces at the start or the end'}`);
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
