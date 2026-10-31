# Kassa AI

[![CI](https://github.com/madinajahongirova01-jpg8/kassa-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/madinajahongirova01-jpg8/kassa-ai/actions/workflows/ci.yml)

**Забон / Язык / Language:** [Тоҷикӣ](#тоҷикӣ) · [Русский](#русский) · [English](#english)

---

## Тоҷикӣ

### Kassa AI

Kassa AI дафтари электронии хазина ва насия барои соҳибони дӯконҳо ва тиҷорати хурд дар Тоҷикистон аст.

### Мушкилот

Бисёр соҳибони тиҷорати хурд дар Тоҷикистон пулро дар дафтари коғазӣ ҳисоб мекунанд. Фоидаи рӯзро дидан душвор аст, насияҳо фаромӯш мешаванд ва пули насия гум мешавад.

### Сайти зинда

- Сайт: https://kassa-ai.vercel.app
- API: https://kassa-ai-api.onrender.com/health
- Ҳисоби демо — бо дархост.

> Сервер ройгон аст. Агар муддате кор накунад, хоб меравад ва оғози аввал то як дақиқа вақт мегирад. Дар ин вақт сайт менависад: «Сервер бедор шуда истодааст, 30–60 сония интизор шавед ва боз кӯшиш кунед».

### Чӣ кор мекунад ҳозир

- Бақайдгирӣ, даромадан ва баромадан.
- **Танзимот:** иваз кардани номи тиҷорат ва ном; иваз кардани парол.
- **Ёрӣ барои корбари нав:** дар «Имрӯз» карточкаи «Аз чӣ сар кунем?» бо се қадам; дар «Сабти нав» намунаҳои тайёр; дар саҳифаҳои холӣ — як маслиҳат ва тугма.
- **Сабти нав:** фурӯш ва хароҷотро бо як матн менависед, масалан «фурӯш 1800, такси 30» ё «продажа 500» ё «sale 500». Матн бо забонҳои тоҷикӣ, русӣ ва англисӣ фаҳмида мешавад.
- **Имрӯз:** чеки рӯз, даромад, хароҷот ва фоидаи рӯз; қарздорони воқеӣ, аввал онҳое, ки мӯҳлаташон гузаштааст.
- **Таҳлили матн бо AI:** Google Gemini, бо қоидаҳо ҳамчун захира. AI танҳо вақте кор мекунад, ки дар сервер `GEMINI_API_KEY` бошад; бе калид матн бо қоидаҳо таҳлил мешавад. Бо AI матн барои таҳлил ба Google фиристода мешавад.
- **Насия:** муштариён ва ҷустуҷӯи онҳо, насияҳо, пардохти пурра ва қисман, насияҳои мӯҳлаташ гузашта, тағйир додани маълумоти муштарӣ, калкулятор, тугмаҳои занг, SMS ва Telegram.
- **Пардохт:** тарзи пардохт (нақд, корт, интиқол); тугмаи «Ҳамааш» тамоми боқимондаро бо як пахш мегузорад.
- **Таҳрири насия:** маблағ, шарҳ ва мӯҳлати қарзро иваз кардан мумкин аст; пардохти хаторо бекор кардан мумкин аст. Таърих нигоҳ дошта мешавад: пардохти бекоршуда хатзада бо «Бекор шуд» нишон дода мешавад ва ба ҳисоб дохил намешавад.
- **Дафтар:** ҳамаи сабтҳо, насияҳо ва пардохтҳо рӯз ба рӯз; CSV ва чоп.
- **Ҳисобот:** ҳафта, моҳ, сол — даромад, хароҷот, фоида, диаграмма, хароҷот аз рӯи категория, насияи баргашта аз рӯи тарзи пардохт; CSV ва чоп.
- **Насб дар телефон (PWA):** сайтро ҳамчун барнома ба экрани телефон гузоштан мумкин аст.
- Интерфейс бо се забон: тоҷикӣ, русӣ, англисӣ.
- Барои телефон мувофиқ аст.

Ростқавлона:

- Матн дар сервер таҳлил мешавад. Агар дар сервер калиди Google Gemini (`GEMINI_API_KEY`) бошад, матн барои таҳлил ба **Google Gemini** фиристода мешавад. Дар нақшаи ройгони Gemini, Google метавонад ин матнро барои беҳтар кардани хизматҳояш истифода барад.
- Бе калид, ҳангоми хато, тайм-аут (8 сония) ё ҷавоби нодурусти AI матн **бо қоидаҳо** (regex) таҳлил мешавад. Дар болои чек ҳамеша навишта мешавад: «AI фаҳмид» ё «Бо қоидаҳо ҳисоб шуд».
- AI худаш ҳеҷ чиз сабт намекунад: сабт танҳо пас аз «Тасдиқ» мешавад. Насия ҳеҷ гоҳ ҳамчун хароҷот сабт намешавад.
- Дар сайти зинда калиди Gemini ҳоло нест, бинобар ин матн бо қоидаҳо таҳлил мешавад.
- Овоз — **бо русӣ ва англисӣ; тоҷикӣ — ба наздикӣ**. Шинохтани овози худи браузер истифода мешавад (масалан Chrome). Дар интерфейси тоҷикӣ забони овозро интихоб мекунед: «Русӣ» ё «English». Матни шинохташуда ба майдон меояд ва мисли матни навишташуда таҳлил мешавад; сабт танҳо пас аз «Тасдиқ» мешавад. Агар браузер овозро дастгирӣ накунад, «Овоз» хомӯш аст.
- Акси чек — **ба наздикӣ**.
- Пардохти онлайни тарофаҳо **нест**.

### Технологияҳо

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- Backend: NestJS 11, Prisma, PostgreSQL.
- Deploy: Vercel (frontend), Render (API), Neon (PostgreSQL).

### Бехатарӣ

- Токени сессия дар cookie-и HttpOnly нигоҳ дошта мешавад; JavaScript-и браузер онро намехонад.
- Даромадан бо JWT; паролҳо бо Argon2id hash мешаванд.
- Шумораи кӯшишҳои даромадан ва бақайдгирӣ маҳдуд аст.
- Ҳар корбар танҳо маълумоти худро мебинад; корбар аз сессия гирифта мешавад, на аз браузер.
- Маблағҳо бо дирам (адади бутун) нигоҳ дошта мешаванд.
- Насия ва пардохт дар транзаксияи база сабт мешаванд.
- `/health` танҳо `{"status":"ok"}` медиҳад, бе маълумот ва бе база.
- Баъди иваз кардани парол ҳамаи сессияҳои кӯҳна (дар дигар дастгоҳҳо низ) бекор мешаванд; сессияи ҷорӣ токени нав мегирад ва кор мекунад.
- Сарлавҳаҳои амниятии сайт: Content-Security-Policy (танҳо манбаъҳои худи сайт), Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (микрофон танҳо барои худи сайт, камера манъ), X-Frame-Options: DENY.
- Dependabot ҳар ҳафта навсозиҳои npm (frontend ва API) ва GitHub Actions-ро месанҷад.

### Тестҳо ва CI

- Frontend: 326 тести Vitest.
- API: 213 тести Jest (unit) ва 175 тести e2e дар 8 файл дар PostgreSQL-и воқеӣ.
- Браузер: 4 сенарияи Playwright (Chromium) — бақайдгирӣ, сабти нав, насия бо пардохти қисман, забони RU ва экрани 390px.
- GitHub Actions ([ci.yml](.github/workflows/ci.yml)) дар ҳар push ба `main` ва ҳар pull request:
  - frontend: `npm ci`, lint, typecheck, Vitest, build;
  - API: PostgreSQL 17, `npm ci`, Prisma generate, lint, typecheck, Jest, `prisma migrate deploy`, тестҳои e2e (auth, профил ва парол, муштариён, насия, пардохтҳо, хазина, ҳисобот), build;
  - browser (баъди frontend ва API): PostgreSQL 17, build-и API ва frontend, Chromium аз кэш, `npm run test:browser`. Gemini, Render ва Vercel истифода намешаванд.

### Оғоз дар компютер

Талабот: Node.js 20.19+ (дар CI — 24), npm, PostgreSQL 14+ (дар CI — 17).

**API** (`apps/api`):

```bash
cd apps/api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

Дар `apps/api/.env` `DATABASE_URL`, `TEST_DATABASE_URL` ва `JWT_SECRET`-и худро нависед (на камтар аз 32 аломат). Базаро бо `prisma migrate reset` пок накунед.

**Frontend** (аз решаи лоиҳа, дар терминали дигар):

```bash
npm install
cp .env.example .env.local
npm run dev
```

Пас http://localhost:3000/login-ро кушоед.

**Тестҳо:**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
cd apps/api && npm run lint && npm run typecheck && npm test && npm run build
cd apps/api && npm run test:e2e
npx playwright install chromium && npm run test:browser
```

`test:e2e` базаи алоҳидаи `TEST_DATABASE_URL`-ро талаб мекунад. `test:browser` ба frontend (3000) ва API (3001)-и аллакай кушода пайваст мешавад.

### Deploy

- **Vercel** — frontend аз решаи лоиҳа. Тағйирёбанда: `KASSA_API_URL`.
- **Render** — API аз `apps/api`. Build: `npm ci --include=dev && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build`. Start: `npm start`. Тағйирёбандаҳо: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`, `NODE_ENV`, `AUTH_THROTTLE_LIMIT`, `AUTH_THROTTLE_TTL_SECONDS`, `TRUST_PROXY`, `ENTRY_PARSE_THROTTLE_LIMIT`, `ENTRY_PARSE_THROTTLE_TTL_SECONDS`, `GEMINI_API_KEY`, `GEMINI_MODEL` (ихтиёрӣ; пешфарз `gemini-3.5-flash-lite`).
- **Neon** — PostgreSQL; сатри пайваст ба `DATABASE_URL`-и Render меравад.

### Сохтор

```text
.
├── src/                 # Frontend (Next.js App Router)
│   ├── app/             # Саҳифаҳо ва Route Handler-ҳо (src/app/api)
│   ├── components/      # Компонентҳо аз рӯи саҳифа
│   ├── lib/             # Мантиқ, парсер, i18n, муштарии API
│   └── proxy.ts         # Забон, ҳимояи /app
├── apps/api/            # Backend (NestJS)
│   ├── prisma/          # schema.prisma ва миграцияҳо
│   ├── src/             # auth, customers, debts, cash-entries, entries (AI + rules), reports, health
│   └── test/            # Тестҳои e2e
├── e2e/                 # Тестҳои браузерӣ (Playwright)
└── .github/             # CI ва Dependabot
```

### Нақша

Инҳо нақша мебошанд, бе мӯҳлат:

- овоз бо забони тоҷикӣ;
- акси чек;
- боти Telegram;
- ёдраскунӣ дар бораи насия;
- пардохти тарофаҳо.

Нархҳо дар `/pricing` нархҳои пешбинӣ мебошанд.

### Муаллиф

Мадина Ҷаҳонгирова

---

## Русский

### Kassa AI

Kassa AI — электронная тетрадь кассы и долгов для владельцев магазинов и малого бизнеса в Таджикистане.

### Проблема

Многие владельцы малого бизнеса в Таджикистане считают деньги в бумажной тетради. Прибыль за день видно с трудом, долги «насия» забываются, и деньги теряются.

### Живой сайт

- Сайт: https://kassa-ai.vercel.app
- API: https://kassa-ai-api.onrender.com/health
- Демо-аккаунт — по запросу.

> Сервер бесплатный. Если им долго не пользуются, он засыпает, и первый запуск может занять до минуты. В это время сайт пишет: «Сервер просыпается, подождите 30–60 секунд и попробуйте снова» (по-таджикски: «Сервер бедор шуда истодааст…»).

### Что умеет сейчас

- Регистрация, вход и выход.
- **Настройки:** изменение названия бизнеса и имени; смена пароля.
- **Помощь новому пользователю:** на «Сегодня» карточка «С чего начать?» с тремя шагами; в «Новой записи» готовые примеры; на пустых страницах — одна подсказка и кнопка.
- **Новая запись:** продажи и расходы одним текстом, например «фурӯш 1800, такси 30», «продажа 500» или «sale 500». Понимает таджикский, русский и английский.
- **Сегодня:** чек за день, доход, расход и прибыль; реальные должники, сначала просроченные.
- **AI-разбор текста:** Google Gemini с запасным вариантом на правилах. AI работает, только если на сервере задан `GEMINI_API_KEY`; без ключа текст разбирается по правилам. С AI текст отправляется в Google для разбора.
- **Насия:** клиенты и поиск по ним, долги, полная и частичная оплата, просрочки, редактирование клиента, калькулятор, кнопки звонка, SMS и Telegram.
- **Оплата:** способ оплаты (нақд — наличные, корт — карта, интиқол — перевод); кнопка «Всё» («Ҳамааш») одним нажатием ставит весь остаток.
- **Редактирование долгов:** можно изменить сумму, описание и срок долга и отменить ошибочную оплату. История сохраняется: отменённая оплата показывается зачёркнутой с пометкой «Отменена» («Бекор шуд») и не учитывается в расчётах.
- **Дафтар:** все записи, долги и оплаты по дням; CSV и печать.
- **Ҳисобот:** неделя, месяц, год — доход, расход, прибыль, график, расходы по категориям, возвращённые долги по способам оплаты; CSV и печать.
- **Установка на телефон (PWA):** сайт можно добавить на экран телефона как приложение.
- Интерфейс на трёх языках: таджикский, русский, английский.
- Адаптирован для телефона.

Честно:

- Текст разбирается на сервере. Если на сервере задан ключ Google Gemini (`GEMINI_API_KEY`), текст отправляется на разбор в **Google Gemini**. На бесплатном тарифе Gemini Google может использовать этот текст для улучшения своих сервисов.
- Без ключа, при ошибке, таймауте (8 секунд) или неверном ответе AI текст разбирается **по правилам** (regex). Над чеком всегда написано: «Разобрал AI» или «Посчитано по правилам».
- AI сам ничего не сохраняет: запись сохраняется только после «Тасдиқ». Долг никогда не сохраняется как расход.
- На живом сайте ключа Gemini пока нет, поэтому текст разбирается по правилам.
- Голос — **на русском и английском; таджикский — скоро**. Используется распознавание речи браузера (например, Chrome). В таджикском интерфейсе язык голоса выбирается: «Русӣ» или «English». Распознанный текст попадает в поле и разбирается так же, как напечатанный; запись сохраняется только после «Тасдиқ». Если браузер не поддерживает распознавание, «Голос» выключен.
- Фото чека — **скоро** («ба наздикӣ»).
- Онлайн-оплаты тарифов — **нет**.

### Технологии

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- Backend: NestJS 11, Prisma, PostgreSQL.
- Деплой: Vercel (frontend), Render (API), Neon (PostgreSQL).

### Безопасность

- Токен сессии хранится в HttpOnly cookie; JavaScript браузера его не читает.
- Вход через JWT; пароли хешируются Argon2id.
- Число попыток входа и регистрации ограничено.
- Каждый пользователь видит только свои данные; пользователь берётся из сессии, а не из браузера.
- Деньги хранятся в дирамах (целые числа).
- Долги и оплаты записываются в транзакции базы.
- `/health` отдаёт только `{"status":"ok"}`, без данных и без обращения к базе.
- После смены пароля все старые сессии (в том числе на других устройствах) перестают работать; текущая сессия получает новый токен и продолжает работать.
- Заголовки безопасности сайта: Content-Security-Policy (только источники самого сайта), Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (микрофон только для самого сайта, камера запрещена), X-Frame-Options: DENY.
- Dependabot раз в неделю проверяет обновления npm (frontend и API) и GitHub Actions.

### Тесты и CI

- Frontend: 326 тестов Vitest.
- API: 213 тестов Jest (unit) и 175 e2e-тестов в 8 файлах на настоящем PostgreSQL.
- Браузер: 4 сценария Playwright (Chromium) — регистрация, новая запись, долг с частичной оплатой, язык RU и экран 390px.
- GitHub Actions ([ci.yml](.github/workflows/ci.yml)) на каждый push в `main` и каждый pull request:
  - frontend: `npm ci`, lint, typecheck, Vitest, build;
  - API: PostgreSQL 17, `npm ci`, Prisma generate, lint, typecheck, Jest, `prisma migrate deploy`, e2e-тесты (auth, профиль и пароль, клиенты, долги, оплаты, касса, отчёты), build;
  - browser (после frontend и API): PostgreSQL 17, сборка API и frontend, Chromium из кэша, `npm run test:browser`. Gemini, Render и Vercel не используются.

### Локальный запуск

Требования: Node.js 20.19+ (в CI — 24), npm, PostgreSQL 14+ (в CI — 17).

**API** (`apps/api`):

```bash
cd apps/api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

В `apps/api/.env` укажите свои `DATABASE_URL`, `TEST_DATABASE_URL` и `JWT_SECRET` (не короче 32 символов). Не сбрасывайте базу через `prisma migrate reset`.

**Frontend** (из корня проекта, в другом терминале):

```bash
npm install
cp .env.example .env.local
npm run dev
```

Затем откройте http://localhost:3000/login.

**Тесты:**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
cd apps/api && npm run lint && npm run typecheck && npm test && npm run build
cd apps/api && npm run test:e2e
npx playwright install chromium && npm run test:browser
```

Для `test:e2e` нужна отдельная база `TEST_DATABASE_URL`. `test:browser` подключается к уже запущенным frontend (3000) и API (3001).

### Деплой

- **Vercel** — frontend из корня проекта. Переменная: `KASSA_API_URL`.
- **Render** — API из `apps/api`. Build: `npm ci --include=dev && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build`. Start: `npm start`. Переменные: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`, `NODE_ENV`, `AUTH_THROTTLE_LIMIT`, `AUTH_THROTTLE_TTL_SECONDS`, `TRUST_PROXY`, `ENTRY_PARSE_THROTTLE_LIMIT`, `ENTRY_PARSE_THROTTLE_TTL_SECONDS`, `GEMINI_API_KEY`, `GEMINI_MODEL` (необязательно; по умолчанию `gemini-3.5-flash-lite`).
- **Neon** — PostgreSQL; строка подключения идёт в `DATABASE_URL` на Render.

### Структура

```text
.
├── src/                 # Frontend (Next.js App Router)
│   ├── app/             # Страницы и Route Handlers (src/app/api)
│   ├── components/      # Компоненты по страницам
│   ├── lib/             # Логика, парсер, i18n, клиент API
│   └── proxy.ts         # Язык, защита /app
├── apps/api/            # Backend (NestJS)
│   ├── prisma/          # schema.prisma и миграции
│   ├── src/             # auth, customers, debts, cash-entries, entries (AI + rules), reports, health
│   └── test/            # e2e-тесты
├── e2e/                 # Браузерные тесты (Playwright)
└── .github/             # CI и Dependabot
```

### План

Это план, без сроков:

- голос на таджикском;
- фото чека;
- Telegram-бот;
- напоминания о долгах;
- оплата тарифов.

Цены на `/pricing` — планируемые.

### Автор

Мадина Ҷаҳонгирова

---

## English

### Kassa AI

Kassa AI is a digital cash book and debt ledger for shop owners and small businesses in Tajikistan.

### The problem

Many small business owners in Tajikistan keep track of money in a paper notebook. The day's profit is hard to see, "nasiya" debts get forgotten, and the money is lost.

### Live site

- Site: https://kassa-ai.vercel.app
- API: https://kassa-ai-api.onrender.com/health
- Demo account: on request.

> The server is on a free plan. After a period without use it goes to sleep, and the first start can take up to a minute. Meanwhile the site shows: "The server is waking up. Wait 30–60 seconds and try again" (in Tajik: «Сервер бедор шуда истодааст…»).

### What it does now

- Sign up, sign in and sign out.
- **Settings:** change the business name and your name; change the password.
- **Help for new users:** a "Where to start?" card with three steps on Today; ready examples on New entry; a hint and a button on empty pages.
- **New entry:** sales and expenses in one line of text, e.g. «фурӯш 1800, такси 30», «продажа 500» or "sale 500". Tajik, Russian and English are understood.
- **Today:** the day's receipt, income, expenses and profit; real debtors, overdue ones first.
- **AI text parsing:** Google Gemini with a rules-based fallback. AI works only if `GEMINI_API_KEY` is set on the server; without a key the text is parsed by rules. With AI the text is sent to Google for parsing.
- **Nasiya:** customers and customer search, debts, full and partial payments, overdue debts, editing a customer, a calculator, call, SMS and Telegram buttons.
- **Payments:** payment method (cash, card, transfer); the "All" («Ҳамааш») button fills in the whole remaining balance with one tap.
- **Editing debts:** change a debt's amount, description and due date, and cancel a payment made by mistake. The history is kept: a cancelled payment is shown crossed out and marked "Cancelled" («Бекор шуд»), and it no longer counts.
- **Ledger (Daftar):** all entries, debts and payments day by day; CSV and print.
- **Reports (Hisobot):** week, month, year — income, expenses, profit, a chart, expenses by category, repaid debts by payment method; CSV and print.
- **Install on a phone (PWA):** the site can be added to the phone's home screen as an app.
- Interface in three languages: Tajik, Russian, English.
- Works on phones.

To be honest:

- Text is parsed on the server. If the server has a Google Gemini key (`GEMINI_API_KEY`), the text is sent to **Google Gemini** for parsing. On Gemini's free tier Google may use this text to improve its services.
- Without a key, or on an error, a timeout (8 seconds) or an invalid AI answer, the text is parsed **by rules** (regex). The receipt always says which one: "Understood by AI" or "Counted by rules".
- AI never saves anything by itself: entries are saved only after "Tasdiq" (confirm). A debt is never saved as an expense.
- The live site has no Gemini key yet, so text is parsed by rules.
- Voice — **in Russian and English; Tajik — coming soon**. It uses the browser's own speech recognition (for example Chrome). In the Tajik interface you choose the voice language: "Русӣ" (Russian) or "English". The recognised text goes into the text field and is parsed just like typed text; nothing is saved until "Tasdiq" (confirm). If the browser doesn't support speech recognition, Voice is turned off.
- Receipt photos are **coming soon** («ба наздикӣ»).
- Online payment for plans is **not available**.

### Technology

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- Backend: NestJS 11, Prisma, PostgreSQL.
- Deployment: Vercel (frontend), Render (API), Neon (PostgreSQL).

### Security

- The session token is kept in an HttpOnly cookie; browser JavaScript cannot read it.
- Sign-in uses JWT; passwords are hashed with Argon2id.
- Sign-in and sign-up attempts are rate limited.
- Each user sees only their own data; the user comes from the session, never from the browser.
- Money is stored in dirams (integers).
- Debts and payments are written in database transactions.
- `/health` returns only `{"status":"ok"}`, with no data and no database access.
- Changing the password ends every older session (other devices included); the current session gets a new token and keeps working.
- Site security headers: Content-Security-Policy (same-origin sources only), Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (microphone for the site itself only, camera off), X-Frame-Options: DENY.
- Dependabot checks npm (frontend and API) and GitHub Actions updates every week.

### Tests and CI

- Frontend: 326 Vitest tests.
- API: 213 Jest unit tests and 175 e2e tests in 8 files against a real PostgreSQL.
- Browser: 4 Playwright scenarios (Chromium) — sign-up, new entry, debt with a partial payment, Russian language and a 390px screen.
- GitHub Actions ([ci.yml](.github/workflows/ci.yml)) on every push to `main` and every pull request:
  - frontend: `npm ci`, lint, typecheck, Vitest, build;
  - API: PostgreSQL 17, `npm ci`, Prisma generate, lint, typecheck, Jest, `prisma migrate deploy`, e2e tests (auth, profile and password, customers, debts, payments, cash, reports), build;
  - browser (after frontend and API): PostgreSQL 17, API and frontend builds, cached Chromium, `npm run test:browser`. No Gemini, Render or Vercel.

### Running locally

Requirements: Node.js 20.19+ (CI uses 24), npm, PostgreSQL 14+ (CI uses 17).

**API** (`apps/api`):

```bash
cd apps/api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

Set your own `DATABASE_URL`, `TEST_DATABASE_URL` and `JWT_SECRET` (at least 32 characters) in `apps/api/.env`. Do not reset the database with `prisma migrate reset`.

**Frontend** (from the project root, in another terminal):

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000/login.

**Tests:**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
cd apps/api && npm run lint && npm run typecheck && npm test && npm run build
cd apps/api && npm run test:e2e
npx playwright install chromium && npm run test:browser
```

`test:e2e` needs a separate `TEST_DATABASE_URL` database. `test:browser` uses the frontend (3000) and API (3001) that are already running.

### Deployment

- **Vercel** — the frontend from the project root. Variable: `KASSA_API_URL`.
- **Render** — the API from `apps/api`. Build: `npm ci --include=dev && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build`. Start: `npm start`. Variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`, `NODE_ENV`, `AUTH_THROTTLE_LIMIT`, `AUTH_THROTTLE_TTL_SECONDS`, `TRUST_PROXY`, `ENTRY_PARSE_THROTTLE_LIMIT`, `ENTRY_PARSE_THROTTLE_TTL_SECONDS`, `GEMINI_API_KEY`, `GEMINI_MODEL` (optional; defaults to `gemini-3.5-flash-lite`).
- **Neon** — PostgreSQL; its connection string goes into `DATABASE_URL` on Render.

### Structure

```text
.
├── src/                 # Frontend (Next.js App Router)
│   ├── app/             # Pages and Route Handlers (src/app/api)
│   ├── components/      # Components by page
│   ├── lib/             # Logic, parser, i18n, API client
│   └── proxy.ts         # Language, /app protection
├── apps/api/            # Backend (NestJS)
│   ├── prisma/          # schema.prisma and migrations
│   ├── src/             # auth, customers, debts, cash-entries, entries (AI + rules), reports, health
│   └── test/            # e2e tests
├── e2e/                 # Browser tests (Playwright)
└── .github/             # CI and Dependabot
```

### Roadmap

These are plans, with no dates:

- voice in Tajik;
- receipt photos;
- a Telegram bot;
- debt reminders;
- payment for plans.

Prices on `/pricing` are planned prices.

### Author

Madina Jahongirova
