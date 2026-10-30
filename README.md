# Kassa AI

Дафтари электронии хазина ва насия барои дӯконҳои хурд · Электронная тетрадь кассы и долгов для небольших магазинов · A digital cash book and debt ledger for small shops

**Забон / Язык / Language:** [Тоҷикӣ](#тоҷикӣ) · [Русский](#русский) · [English](#english)

> Лоиҳа дар марҳилаи таҳия аст ва ҳоло дар ҷое ҷойгир (deploy) нашудааст.
> Проект в разработке и пока нигде не развёрнут.
> The project is under development and is not deployed anywhere yet.

---

## Тоҷикӣ

### Лоиҳа дар бораи чӣ

Kassa AI ба соҳиби дӯкон кӯмак мекунад, ки даромад, хароҷот ва насияи муштариёнро сабт кунад ва фоидаи рӯз, ҳафта, моҳ ва солро бинад. Интерфейс бо забони тоҷикӣ аст. Маблағҳо бо сомонӣ ҳисоб мешаванд.

Лоиҳа аз ду барнома иборат аст:

- **Frontend** — Next.js дар решаи репозиторий (`/`), порти `3000`.
- **Backend API** — NestJS дар `apps/api`, порти `3001`, базаи PostgreSQL.

Браузер бевосита ба API муроҷиат намекунад: Route Handler-ҳои Next.js (`src/app/api/*`) дархостҳоро ба API мефиристанд, токени сессия дар cookie-и `httpOnly` (`kassa_session`) нигоҳ дошта мешавад.

### Имкониятҳои амалан иҷрошуда

| Саҳифа | Чӣ кор мекунад |
| --- | --- |
| `/` | Саҳифаи асосӣ (landing). |
| `/pricing` | Тарофаҳо. Пардохти онлайн пайваст нашудааст. |
| `/login` | Даромадан ва бақайдгирӣ (почта, парол, номи тиҷорат, ном — ихтиёрӣ). |
| `/app` — Имрӯз | Даромад ва хароҷоти имрӯз аз база. Блоки «Ба шумо қарздоранд» ҳоло маълумоти намунавӣ нишон медиҳад (бо нишони «демо»). |
| `/app/new` — Сабти нав | Матнро менависед (масалан «такси 30, фурӯш 1800»), барнома онро бо қоидаҳои оддӣ ба сатрҳо ҷудо мекунад, шумо тасдиқ мекунед ва сабтҳо дар база нигоҳ дошта мешаванд. Сатрҳои насия дар ин ҷо сабт намешаванд. |
| `/app/transactions` — Дафтар | Ҳамаи сабтҳо, насияҳо ва пардохтҳо рӯз ба рӯз барои як моҳ; содирот ба CSV ва чоп. |
| `/app/debts` — Насия | Муштарии нав, насияи нав, қабули пардохт (аз насияи кӯҳнатарин сар карда), филтрҳо, тугмаҳои занг ва SMS (рақами телефон санҷида мешавад). |
| `/app/reports` — Ҳисобот | Ҳафта / моҳ / сол: даромад, хароҷот, фоида, диаграмма, хароҷот аз рӯи категория, насияи додашуда ва баргардонидашуда; CSV ва чоп. |
| `/admin` | Танҳо саҳифаи холӣ бо нишони «демо». |

Backend: бақайдгирӣ ва даромадан (JWT), маҳдудияти кӯшишҳо барои `/auth/register` ва `/auth/login`, муштариён, насияҳо, пардохтҳо, сабтҳои хазина, ҳисоботи ҷамъбастӣ. Ҳар корбар танҳо маълумоти худро мебинад.

### Маҳдудиятҳо

- **AI ҳоло пайваст нашудааст.** Матн дар «Сабти нав» бо қоидаҳои оддӣ (regex) таҳлил мешавад, на бо модели AI.
- **Вуруди овозӣ ба таъхир гузошта шудааст.** Режими «Овоз» танҳо санҷишӣ аст: шинохтани овози худи браузерро (Web Speech API) истифода мебарад ва на ҳама браузерҳо онро дастгирӣ мекунанд.
- **Акси чек иҷро нашудааст.** Тугмаи «Акси чек» ғайрифаъол аст («Ба наздикӣ»).
- Пардохти онлайни тарофаҳо нест; панели `/admin` холӣ аст.
- Насия ва пардохтро тағйир додан ё нест кардан мумкин нест; сабтҳои хазинаро ҳам. Муштариро нест кардан мумкин нест.
- Токени нав кардан (refresh), барқарор кардани парол ва тасдиқи почта нест. Баромадан танҳо cookie-ро пок мекунад.
- Дархости такрории пардохт пардохти дуюм сабт мекунад (idempotency нест).

### Стек

- Frontend: Next.js 16.4, React 19.3, TypeScript 5, Tailwind CSS 4, Recharts 3, Vitest 3, ESLint 9.
- Backend: NestJS 11, TypeScript 5.9, Prisma 7.10 (`@prisma/adapter-pg`), PostgreSQL, Argon2id, JWT (HS256), `@nestjs/throttler`, Jest 30, Supertest.
- CI: GitHub Actions (`.github/workflows/ci.yml`), Node.js 24, PostgreSQL 17.

### Сохтор

```text
.
├── src/                    # Frontend (Next.js App Router)
│   ├── app/                # Саҳифаҳо ва Route Handler-ҳо (src/app/api)
│   ├── components/         # Компонентҳои UI аз рӯи саҳифаҳо
│   ├── data/               # Матнҳо ва маълумоти намунавӣ
│   ├── lib/                # Мантиқ, ҳисобҳо, муштарии API (lib/api)
│   └── proxy.ts            # Бе cookie-и сессия /app/* → /login
├── apps/api/               # Backend (NestJS)
│   ├── prisma/             # schema.prisma ва миграцияҳо
│   ├── src/                # auth, customers, debts, cash-entries, reports, common, config
│   └── test/               # Тестҳои e2e
├── design/                 # Маводи дизайн
└── .github/workflows/ci.yml
```

### Талабот

- Node.js 20.19+ (дар CI — 24) ва npm
- PostgreSQL 14+ (дар CI — 17)

### Насб ва оғоз

**1. PostgreSQL.** Ҳар PostgreSQL-и маҳаллӣ кор мекунад. Мисол бо Docker. Паролро худатон интихоб кунед (танҳо ҳарфҳои лотинӣ, рақамҳо ва дефис, то дар `DATABASE_URL` бе тағйир истифода шавад) ва ҳамон паролро дар `DATABASE_URL` ва `TEST_DATABASE_URL`-и `apps/api/.env` нависед:

```bash
KASSA_DB_PASSWORD='change-me-local-password'
docker run -d --name kassa-postgres -p 5432:5432 \
  -e POSTGRES_USER=kassa -e POSTGRES_PASSWORD="$KASSA_DB_PASSWORD" -e POSTGRES_DB=kassa_ai \
  postgres:17
# То 60 сония интизор мешавем, то PostgreSQL пайвастҳоро қабул кунад
for attempt in $(seq 1 60); do
  docker exec kassa-postgres pg_isready -q -h 127.0.0.1 -U kassa -d kassa_ai && break
  sleep 1
done
docker exec kassa-postgres createdb -U kassa kassa_ai_test   # танҳо барои тестҳои e2e
```

**2. Backend:**

```bash
cd apps/api
npm install
cp .env.example .env            # пас .env-ро таҳрир кунед
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev               # http://localhost:3001
```

**3. Frontend** (дар терминали дигар, аз решаи репозиторий):

```bash
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

Пас `http://localhost:3000/login`-ро кушоед ва ҳисоб кушоед.

### Тағйирёбандаҳои муҳит

Файлҳои `.env` ва `.env.local`-ро ба git илова накунед. Сирҳои воқеиро дар README ва коммитҳо нанависед.

Frontend — `.env.local` дар реша:

| Тағйирёбанда | Ҳатмӣ | Тавсиф |
| --- | --- | --- |
| `KASSA_API_URL` | ҳа | Суроғаи API, масалан `http://localhost:3001`. Танҳо дар сервер истифода мешавад. |

Backend — `apps/api/.env`:

| Тағйирёбанда | Ҳатмӣ | Пешфарз | Тавсиф |
| --- | --- | --- | --- |
| `DATABASE_URL` | ҳа | — | Сатри пайвасти PostgreSQL |
| `JWT_SECRET` | ҳа | — | Сатри тасодуфӣ, на камтар аз 32 аломат (масалан `openssl rand -base64 48`) |
| `JWT_EXPIRES_IN_SECONDS` | не | `3600` | Мӯҳлати токен бо сония |
| `PORT` | не | `3001` | Порти API |
| `NODE_ENV` | не | `development` | `development`, `test` ё `production` |
| `AUTH_THROTTLE_LIMIT` | не | `10` | Шумораи кӯшишҳои бақайдгирӣ/даромадан дар як давра |
| `AUTH_THROTTLE_TTL_SECONDS` | не | `60` | Давраи маҳдудият бо сония |
| `TRUST_PROXY` | не | `loopback` | Проксиҳои боэътимод (IP, CIDR ё `loopback`/`linklocal`/`uniquelocal`) |
| `TEST_DATABASE_URL` | барои e2e | — | Базаи алоҳида; номаш бояд бо `_test` анҷом ёбад |

Агар тағйирёбандаи ҳатмӣ набошад ё нодуруст бошад, API оғоз намешавад.

### Фармонҳо

Frontend (реша):

| Фармон | Вазифа |
| --- | --- |
| `npm run dev` | Сервери таҳия |
| `npm run lint` | ESLint |
| `npx next typegen && npx tsc --noEmit` | Санҷиши типҳо (мисли CI) |
| `npm test` | Тестҳои Vitest (`src/**/*.test.ts`) |
| `npm run build` | Сохтани production |
| `npm start` | Оғози build-и тайёр |

Backend (`apps/api`):

| Фармон | Вазифа |
| --- | --- |
| `npm run start:dev` | API бо watch |
| `npm run build` / `npm start` | Сохтан / оғози `dist/main.js` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit-тестҳо (Jest), база лозим нест |
| `npm run test:e2e` | Тестҳои HTTP + база (`TEST_DATABASE_URL` лозим) |
| `npm run prisma:generate` | Сохтани Prisma Client ба `src/generated/prisma` |
| `npm run prisma:migrate:deploy` | Татбиқи миграцияҳо |
| `npm run prisma:migrate:dev` | Миграцияи нав пас аз тағйири `schema.prisma` |

Тестҳои e2e танҳо ба базае кор мекунанд, ки номаш бо `_test` анҷом меёбад, ва дар байни тестҳо ҳамаи маълумотро пок мекунанд. Ба базаи маълумоти воқеӣ равона накунед.

### API

Рӯйхати пурраи endpoint-ҳо ва форматҳо дар бахши [English → API reference](#api-reference) аст.

---

## Русский

### О проекте

Kassa AI помогает владельцу магазина записывать доходы, расходы и долги покупателей и видеть прибыль за день, неделю, месяц и год. Интерфейс на таджикском языке. Суммы считаются в сомони.

Проект состоит из двух приложений:

- **Frontend** — Next.js в корне репозитория (`/`), порт `3000`.
- **Backend API** — NestJS в `apps/api`, порт `3001`, база PostgreSQL.

Браузер не обращается к API напрямую: Route Handlers Next.js (`src/app/api/*`) пересылают запросы в API, токен сессии хранится в `httpOnly`-cookie (`kassa_session`).

### Реализованные возможности

| Страница | Что делает |
| --- | --- |
| `/` | Лендинг. |
| `/pricing` | Тарифы. Онлайн-оплата не подключена. |
| `/login` | Вход и регистрация (email, пароль, название бизнеса, имя — необязательно). |
| `/app` — Сегодня | Доходы и расходы за сегодня из базы. Блок «Вам должны» пока показывает пример данных (с пометкой «демо»). |
| `/app/new` — Новая запись | Вы пишете текст (например «такси 30, фурӯш 1800»), приложение разбивает его на строки по простым правилам, вы подтверждаете — записи сохраняются в базе. Строки о долгах здесь не сохраняются. |
| `/app/transactions` — Тетрадь | Все записи, долги и платежи по дням за месяц; экспорт в CSV и печать. |
| `/app/debts` — Долги | Новый покупатель, новый долг, приём платежа (гасит сначала самый старый долг), фильтры, кнопки звонка и SMS (номер телефона проверяется). |
| `/app/reports` — Отчёт | Неделя / месяц / год: доход, расход, прибыль, график, расходы по категориям, выданные и возвращённые долги; CSV и печать. |
| `/admin` | Только пустая страница с пометкой «демо». |

Backend: регистрация и вход (JWT), ограничение частоты запросов для `/auth/register` и `/auth/login`, покупатели, долги, платежи, кассовые записи, сводный отчёт. Каждый пользователь видит только свои данные.

### Ограничения

- **AI пока не подключён.** Текст в «Новой записи» разбирается простыми правилами (regex), а не AI-моделью.
- **Голосовой ввод отложен.** Режим «Овоз» только экспериментальный: использует встроенное распознавание речи браузера (Web Speech API), которое поддерживают не все браузеры.
- **Фото чека не реализовано.** Кнопка «Акси чек» неактивна («Скоро»).
- Онлайн-оплаты тарифов нет; панель `/admin` пустая.
- Долги, платежи и кассовые записи нельзя редактировать или удалять. Покупателя нельзя удалить.
- Нет refresh-токенов, сброса пароля и подтверждения email. Выход только очищает cookie.
- Повтор запроса платежа создаёт второй платёж (нет идемпотентности).

### Стек

- Frontend: Next.js 16.4, React 19.3, TypeScript 5, Tailwind CSS 4, Recharts 3, Vitest 3, ESLint 9.
- Backend: NestJS 11, TypeScript 5.9, Prisma 7.10 (`@prisma/adapter-pg`), PostgreSQL, Argon2id, JWT (HS256), `@nestjs/throttler`, Jest 30, Supertest.
- CI: GitHub Actions (`.github/workflows/ci.yml`), Node.js 24, PostgreSQL 17.

### Структура

```text
.
├── src/                    # Frontend (Next.js App Router)
│   ├── app/                # Страницы и Route Handlers (src/app/api)
│   ├── components/         # UI-компоненты по страницам
│   ├── data/               # Тексты и демо-данные
│   ├── lib/                # Логика, расчёты, клиент API (lib/api)
│   └── proxy.ts            # Без cookie сессии /app/* → /login
├── apps/api/               # Backend (NestJS)
│   ├── prisma/             # schema.prisma и миграции
│   ├── src/                # auth, customers, debts, cash-entries, reports, common, config
│   └── test/               # E2E-тесты
├── design/                 # Дизайн-материалы
└── .github/workflows/ci.yml
```

### Требования

- Node.js 20.19+ (в CI — 24) и npm
- PostgreSQL 14+ (в CI — 17)

### Установка и запуск

**1. PostgreSQL.** Подойдёт любой локальный PostgreSQL. Пример с Docker. Пароль выберите сами (только латинские буквы, цифры и дефис, чтобы его можно было без изменений вставить в `DATABASE_URL`) и укажите тот же пароль в `DATABASE_URL` и `TEST_DATABASE_URL` в `apps/api/.env`:

```bash
KASSA_DB_PASSWORD='change-me-local-password'
docker run -d --name kassa-postgres -p 5432:5432 \
  -e POSTGRES_USER=kassa -e POSTGRES_PASSWORD="$KASSA_DB_PASSWORD" -e POSTGRES_DB=kassa_ai \
  postgres:17
# Ждём до 60 секунд, пока PostgreSQL начнёт принимать подключения
for attempt in $(seq 1 60); do
  docker exec kassa-postgres pg_isready -q -h 127.0.0.1 -U kassa -d kassa_ai && break
  sleep 1
done
docker exec kassa-postgres createdb -U kassa kassa_ai_test   # только для e2e-тестов
```

**2. Backend:**

```bash
cd apps/api
npm install
cp .env.example .env            # затем отредактируйте .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev               # http://localhost:3001
```

**3. Frontend** (в другом терминале, из корня репозитория):

```bash
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

Откройте `http://localhost:3000/login` и зарегистрируйтесь.

### Переменные окружения

Не добавляйте `.env` и `.env.local` в git. Не пишите настоящие секреты в README и коммиты.

Frontend — `.env.local` в корне:

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `KASSA_API_URL` | да | Адрес API, например `http://localhost:3001`. Используется только на сервере. |

Backend — `apps/api/.env`:

| Переменная | Обязательна | По умолчанию | Описание |
| --- | --- | --- | --- |
| `DATABASE_URL` | да | — | Строка подключения к PostgreSQL |
| `JWT_SECRET` | да | — | Случайная строка не короче 32 символов (например `openssl rand -base64 48`) |
| `JWT_EXPIRES_IN_SECONDS` | нет | `3600` | Срок жизни токена в секундах |
| `PORT` | нет | `3001` | Порт API |
| `NODE_ENV` | нет | `development` | `development`, `test` или `production` |
| `AUTH_THROTTLE_LIMIT` | нет | `10` | Число попыток регистрации/входа за период |
| `AUTH_THROTTLE_TTL_SECONDS` | нет | `60` | Длина периода ограничения в секундах |
| `TRUST_PROXY` | нет | `loopback` | Доверенные прокси (IP, CIDR или `loopback`/`linklocal`/`uniquelocal`) |
| `TEST_DATABASE_URL` | для e2e | — | Отдельная база; имя должно заканчиваться на `_test` |

Если обязательная переменная отсутствует или некорректна, API не запустится.

### Команды

Frontend (корень):

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Сервер разработки |
| `npm run lint` | ESLint |
| `npx next typegen && npx tsc --noEmit` | Проверка типов (как в CI) |
| `npm test` | Тесты Vitest (`src/**/*.test.ts`) |
| `npm run build` | Production-сборка |
| `npm start` | Запуск готовой сборки |

Backend (`apps/api`):

| Команда | Назначение |
| --- | --- |
| `npm run start:dev` | API в режиме watch |
| `npm run build` / `npm start` | Сборка / запуск `dist/main.js` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit-тесты (Jest), база не нужна |
| `npm run test:e2e` | HTTP + база (нужен `TEST_DATABASE_URL`) |
| `npm run prisma:generate` | Генерация Prisma Client в `src/generated/prisma` |
| `npm run prisma:migrate:deploy` | Применить миграции |
| `npm run prisma:migrate:dev` | Новая миграция после изменения `schema.prisma` |

E2E-тесты работают только с базой, имя которой заканчивается на `_test`, и между тестами удаляют все данные. Не направляйте их на базу с настоящими данными.

### API

Полный список endpoints и форматов — в разделе [English → API reference](#api-reference).

---

## English

### About

Kassa AI helps a shop owner record income, expenses and customer debts, and see profit for a day, week, month or year. The user interface is in Tajik. Amounts are in somoni.

The project has two applications:

- **Frontend** — Next.js at the repository root (`/`), port `3000`.
- **Backend API** — NestJS in `apps/api`, port `3001`, PostgreSQL database.

The browser never calls the API directly: Next.js Route Handlers (`src/app/api/*`) forward requests to the API, and the session token is kept in an `httpOnly` cookie (`kassa_session`). State-changing requests are accepted only from the same origin.

### Implemented features

| Page | What it does |
| --- | --- |
| `/` | Landing page. |
| `/pricing` | Plans. Online payment is not connected. |
| `/login` | Sign in and registration (email, password, business name, optional name). |
| `/app` — Today | Today's income and expenses from the database. The "they owe you" block still shows sample data (marked "demo"). |
| `/app/new` — New entry | You type text (e.g. "такси 30, фурӯш 1800"), the app splits it into lines using simple rules, you confirm, and the entries are saved to the database. Lines recognised as debts are not saved here. |
| `/app/transactions` — Ledger | All cash entries, debts and payments by day for a month; CSV export and print. |
| `/app/debts` — Debts | New customer, new debt, receiving a payment (oldest debt is paid first), filters, call and SMS buttons (phone numbers are validated). |
| `/app/reports` — Reports | Week / month / year: income, expense, profit, chart, expenses by category, debts given and returned; CSV export and print. |
| `/admin` | Placeholder page marked "demo" only. |

Backend: registration and login (JWT), rate limiting on `/auth/register` and `/auth/login`, customers, debts, payments, cash entries, summary report. Every user sees only their own data.

### Limitations

- **AI is not connected yet.** Text on the "New entry" page is parsed with simple rules (regular expressions), not an AI model.
- **Voice input is postponed.** The "Овоз" (voice) mode is experimental only: it uses the browser's built-in speech recognition (Web Speech API), which not every browser supports.
- **Receipt photos are not implemented.** The "Акси чек" button is disabled ("coming soon").
- No online payment for plans; the `/admin` panel is empty.
- Debts, payments and cash entries cannot be edited or deleted. Customers cannot be deleted.
- No refresh tokens, password reset or email verification. Logout only clears the cookie (tokens stay valid until they expire).
- Payment requests are not idempotent: retrying a successful request records a second payment.
- Not production-ready and not deployed.

### Stack

- Frontend: Next.js 16.4, React 19.3, TypeScript 5, Tailwind CSS 4, Recharts 3, Vitest 3, ESLint 9.
- Backend: NestJS 11, TypeScript 5.9, Prisma 7.10 (`@prisma/adapter-pg`), PostgreSQL, Argon2id, JWT (HS256), `@nestjs/throttler`, Jest 30, Supertest.
- CI: GitHub Actions (`.github/workflows/ci.yml`), Node.js 24, PostgreSQL 17.

### Structure

```text
.
├── src/                    # Frontend (Next.js App Router)
│   ├── app/                # Pages and Route Handlers (src/app/api)
│   ├── components/         # UI components grouped by page
│   ├── data/               # Texts and sample data
│   ├── lib/                # Logic, calculations, API client (lib/api)
│   └── proxy.ts            # Redirects /app/* to /login without a session cookie
├── apps/api/               # Backend (NestJS)
│   ├── prisma/             # schema.prisma and migrations
│   ├── src/                # auth, customers, debts, cash-entries, reports, common, config
│   └── test/               # E2E tests
├── design/                 # Design materials
└── .github/workflows/ci.yml
```

Database tables (`apps/api/prisma/schema.prisma`): `users`, `customers`, `debts`, `payments`, `cash_entries`. Money is stored as integer dirams (1 somoni = 100 dirams).

### Requirements

- Node.js 20.19+ (CI uses 24) and npm
- PostgreSQL 14+ (CI uses 17)

### Setup and running

**1. PostgreSQL.** Any local PostgreSQL works. Docker example. Choose your own password (Latin letters, digits and dashes only, so it can go into `DATABASE_URL` unchanged) and put the same password into `DATABASE_URL` and `TEST_DATABASE_URL` in `apps/api/.env`:

```bash
KASSA_DB_PASSWORD='change-me-local-password'
docker run -d --name kassa-postgres -p 5432:5432 \
  -e POSTGRES_USER=kassa -e POSTGRES_PASSWORD="$KASSA_DB_PASSWORD" -e POSTGRES_DB=kassa_ai \
  postgres:17
# Wait up to 60 seconds until PostgreSQL accepts connections
for attempt in $(seq 1 60); do
  docker exec kassa-postgres pg_isready -q -h 127.0.0.1 -U kassa -d kassa_ai && break
  sleep 1
done
docker exec kassa-postgres createdb -U kassa kassa_ai_test   # only for e2e tests
```

**2. Backend:**

```bash
cd apps/api
npm install
cp .env.example .env            # then edit .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev               # http://localhost:3001
```

**3. Frontend** (in another terminal, from the repository root):

```bash
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

Open `http://localhost:3000/login` and create an account.

### Environment variables

Never commit `.env` or `.env.local`. Do not put real secrets in the README or in commits.

Frontend — `.env.local` at the root:

| Variable | Required | Description |
| --- | --- | --- |
| `KASSA_API_URL` | yes | API address, e.g. `http://localhost:3001`. Server-side only (no `NEXT_PUBLIC_` prefix). |

Backend — `apps/api/.env`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `JWT_SECRET` | yes | — | Random string, at least 32 characters (e.g. `openssl rand -base64 48`); the example value is rejected in production |
| `JWT_EXPIRES_IN_SECONDS` | no | `3600` | Access token lifetime in seconds |
| `PORT` | no | `3001` | API port |
| `NODE_ENV` | no | `development` | `development`, `test` or `production` |
| `AUTH_THROTTLE_LIMIT` | no | `10` | Register/login attempts allowed per period |
| `AUTH_THROTTLE_TTL_SECONDS` | no | `60` | Rate-limit period in seconds |
| `TRUST_PROXY` | no | `loopback` | Trusted proxies (IPs, CIDR ranges or `loopback`/`linklocal`/`uniquelocal`) |
| `TEST_DATABASE_URL` | for e2e | — | Separate database whose name must end with `_test` |

The API refuses to start if a required variable is missing or invalid.

### Commands

Frontend (root):

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npx next typegen && npx tsc --noEmit` | Type check (same as CI) |
| `npm test` | Vitest tests (`src/**/*.test.ts`) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

Backend (`apps/api`):

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | API in watch mode |
| `npm run build` / `npm start` | Build / run `dist/main.js` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Jest), no database needed |
| `npm run test:e2e` | HTTP + database tests (needs `TEST_DATABASE_URL`) |
| `npm run prisma:generate` | Generate the Prisma Client into `src/generated/prisma` (git-ignored) |
| `npm run prisma:migrate:deploy` | Apply committed migrations |
| `npm run prisma:migrate:dev` | Create a new migration after changing `schema.prisma` |

E2E tests use `TEST_DATABASE_URL` only, refuse to run unless the database name ends with `_test`, apply migrations and delete all data between tests. Never point them at a database with real data.

CI runs on every pull request and on pushes to `main`: frontend lint, type check, unit tests and build; API Prisma generate, lint, type check, unit tests, migrations, e2e tests and build.

### API reference

Base URL: `http://localhost:3001`. All endpoints except register and login require `Authorization: Bearer <token>`. Another user's record is answered with `404`, exactly like a missing one.

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ email, password, businessName, name? }` | `201` `{ accessToken, tokenType, expiresIn, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `200`, same shape |
| `GET` | `/auth/me` | | `200` `{ user }` |
| `POST` | `/customers` | `{ name, phone?, note? }` | `201` customer with `balance` |
| `GET` | `/customers` | | `200` customer list |
| `GET` | `/customers/:id` | | `200` customer |
| `PATCH` | `/customers/:id` | any of `name`, `phone`, `note` (`phone` and `note` can be `null` to clear them) | `200` customer |
| `POST` | `/customers/:customerId/debts` | `{ amount, description, occurredOn, dueOn? }` | `201` debt |
| `GET` | `/customers/:customerId/debts` | | `200` debts of the customer |
| `POST` | `/customers/:customerId/payments` | `{ amount, paidOn?, note? }` | `201` `{ amount, payments, debts }`, paid against the customer's oldest open debts first |
| `GET` | `/debts` | `?status=ACTIVE\|PARTIALLY_PAID\|PAID&customerId=` | `200` debt list |
| `GET` | `/debts/:id` | | `200` debt with payments |
| `POST` | `/debts/:id/payments` | `{ amount, paidOn?, note? }` | `201` `{ payment, debt }` |
| `GET` | `/debts/:id/payments` | | `200` payment list |
| `GET` | `/payments` | `?from&to&limit&cursor` | `200` `{ items, nextCursor }` |
| `POST` | `/cash-entries` | `{ entries: [{ kind, category, amount, title, occurredOn?, source }] }` (1–50, saved all-or-nothing) | `201` list of created entries |
| `GET` | `/cash-entries` | `?from&to&kind&limit&cursor` | `200` `{ items, nextCursor }` |
| `GET` | `/reports/summary` | `?from&to` (required, max 366 days) | `200` `{ from, to, today, days, expenseByCategory, totals }` |

- **Validation:** unknown body or query fields are rejected with `400`. Passwords are 8–128 characters.
- **Money:** strings in somoni with up to two decimals (`"150.50"`), range `0.01`–`10000000.00`; responses always use two decimals.
- **Dates:** `YYYY-MM-DD`; "today" is calculated in the Asia/Dushanbe time zone and is the default for a cash entry's `occurredOn` and a payment's `paidOn`. A debt's `occurredOn`, a cash entry's `occurredOn` and a payment's `paidOn` cannot be in the future; `dueOn` cannot be earlier than `occurredOn`; `paidOn` cannot be earlier than the debt's `occurredOn`; `from` cannot be later than `to`.
- **Enums:** `kind` = `INCOME` / `EXPENSE`; `category` = `SALE`, `GOODS`, `SALARY`, `UTILITIES`, `TRANSPORT`, `RENT`, `OTHER`; `source` = `VOICE`, `TEXT`, `PHOTO`; debt `status` is calculated automatically.
- **Pagination:** `limit` 1–200 (default 50); pass `nextCursor` back as `cursor`.
- **Errors:** `{ statusCode, error, message, details? }`. `400` invalid input, `401` missing/invalid token or wrong credentials, `404` not found, `409` email already registered, `422` payment exceeds the remaining debt (or the debt is already paid / the customer has no open debts), `429` too many auth attempts.
