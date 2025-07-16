const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }

  return data;
}

interface Buyers {
  id: number;
  name: string;
  phone: string;
}

export const apiClient = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string }>("/api/auth/login", "POST", { email, password }),

  register: (email: string, password: string) =>
    apiRequest<{ message: string }>("/api/auth/register", "POST", { email, password }),

  getProfile: (token: string) =>
    apiRequest<{ email: string; name?: string }>("/api/auth/me", "GET", undefined, token),

   // ✅ ดึงรายชื่อ buyers
  getBuyers: (token: string) =>
    apiRequest<Buyers[]>("/api/buyers", "GET", undefined, token),

  // ✅ เพิ่ม buyer
  addBuyer: (buyer: { name: string; phone: string }, token: string) =>
    apiRequest<Buyers>("/api/buyers", "POST", buyer, token),

  // ✅ ลบ buyer
  deleteBuyer: (id: number, token: string) =>
    apiRequest(`/api/buyers/${id}`, "DELETE", undefined, token),
};
