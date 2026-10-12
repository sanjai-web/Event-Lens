const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eventlens_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = await res.text();
    }
    throw new ApiError(errorDetail, res.status);
  }

  // Handle empty 204 or responses with no body
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  signup: (data: any) => request<any>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<any>("/auth/me"),

  // Events
  listEvents: () => request<any[]>("/events"),
  getEvent: (id: string) => request<any>(`/events/${id}`),
  createEvent: (data: any) => request<any>("/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => request<any>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  
  // Photos
  presignUpload: (eventId: string, files: any[]) =>
    request<any>(`/events/${eventId}/photos/presign`, { method: "POST", body: JSON.stringify({ files }) }),
  confirmUpload: (eventId: string, uploaded: any[]) =>
    request<any>(`/events/${eventId}/photos/confirm`, { method: "POST", body: JSON.stringify({ uploaded }) }),
  listPhotos: (eventId: string) => request<any[]>(`/events/${eventId}/photos`),
  deletePhoto: (eventId: string, photoId: string) =>
    request<any>(`/events/${eventId}/photos/${photoId}`, { method: "DELETE" }),

  // Renewal & QR
  renewEvent: (id: string, days: number = 30) =>
    request<any>(`/events/${id}/renew?days=${days}`, { method: "POST" }),
  getQrDownloadUrl: (id: string) => `${API_BASE}/events/${id}/qr/download`,

  // Guest & Public
  getPublicEventInfo: (slug: string) => request<any>(`/public/events/${slug}/info`),
  getPublicGallery: (slug: string, cursor?: string) =>
    request<any>(`/public/events/${slug}/gallery${cursor ? `?cursor=${cursor}` : ""}`),
  selfieSearch: (slug: string, formData: FormData) =>
    request<any>(`/public/events/${slug}/selfie-search`, { method: "POST", body: formData }),
  registerGuest: (slug: string, data: any) =>
    request<any>(`/public/events/${slug}/guests`, { method: "POST", body: JSON.stringify(data) }),

  // Payments
  createOrder: (eventId: string, planTier: string) =>
    request<any>("/payments/create-order", { method: "POST", body: JSON.stringify({ event_id: eventId, plan_tier: planTier }) }),
  verifyPayment: (data: any) => request<any>("/payments/verify", { method: "POST", body: JSON.stringify(data) }),
};
