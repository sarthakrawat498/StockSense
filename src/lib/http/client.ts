import type { ApiResponse } from "@/types/api.types";

export class ApiClientError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly errors?: ApiResponse["errors"],
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
	const response = await fetch(input, {
		...init,
		headers: {
			...(init?.body ? { "Content-Type": "application/json" } : {}),
			...init?.headers,
		},
		credentials: "include",
	});

	let payload: ApiResponse<T>;
	try {
		payload = (await response.json()) as ApiResponse<T>;
	} catch {
		throw new ApiClientError("The server returned an invalid response", response.status);
	}

	if (!response.ok || !payload.success) {
		throw new ApiClientError(payload.message ?? "Request failed", response.status, payload.errors);
	}

	return payload.data as T;
}

export const httpClient = {
	get: <T>(url: string) => request<T>(url),
	post: <T>(url: string, body: unknown) => request<T>(url, { method: "POST", body: JSON.stringify(body) }),
	patch: <T>(url: string, body: unknown) => request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
	delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
