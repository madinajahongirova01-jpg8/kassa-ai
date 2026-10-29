// Browser-side calls to our own Route Handlers (/api/...). The session token stays in the httpOnly
// cookie: the browser sends it, but JavaScript never reads it.

export type PostResult<T> = { ok: true; data: T } | { ok: false; status: number; details: string[] };

export async function postJson<T = unknown>(url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data: unknown = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: data as T };
    const details = (data as { details?: unknown } | null)?.details;
    return { ok: false, status: response.status, details: Array.isArray(details) ? details.filter((d) => typeof d === "string") : [] };
  } catch {
    return { ok: false, status: 0, details: [] };
  }
}

const REMAINING = /^remainingAmount: (\d+\.\d{2})$/;

export function requestErrorText(status: number, details: string[] = []) {
  if (status === 422) {
    const remaining = details.map((d) => REMAINING.exec(d)?.[1]).find(Boolean);
    return remaining ? `Пардохт аз қарз зиёд аст — боқимонда ${remaining} смн.` : "Ин пардохтро қабул кардан намешавад.";
  }
  if (status === 429) return "Кӯшишҳо зиёд шуданд. Каме сабр кунед ва боз кӯшиш кунед.";
  if (status === 401) return "Вақти даромадан гузашт. Аз нав дароед.";
  if (status === 404) return "Сабт ёфт нашуд. Саҳифаро нав кунед.";
  if (status === 400) return "Маълумотро санҷед.";
  if (status === 403) return "Дархост рад шуд. Саҳифаро нав кунед ва боз кӯшиш кунед.";
  return "Сервер ҳоло ҷавоб намедиҳад. Каме баъд боз кӯшиш кунед.";
}
