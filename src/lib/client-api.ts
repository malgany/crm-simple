type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
} & T;

function buildUrl(path: string, companyId?: string | null) {
  if (!companyId) {
    return path;
  }

  const url = new URL(path, window.location.origin);
  url.searchParams.set("companyId", companyId);
  return `${url.pathname}${url.search}`;
}

export async function requestApi<T>(
  path: string,
  init?: RequestInit,
  companyId?: string | null,
): Promise<ApiEnvelope<T>> {
  const response = await fetch(buildUrl(path, companyId), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Não foi possível concluir a solicitacao.");
  }

  return payload;
}
