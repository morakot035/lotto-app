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

   if (!res.ok || data?.success === false) {
    // รองรับได้ทั้งกรณี message และ error.message
    const message =
      data?.message || data?.error?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
    throw new Error(message);
  }

  return data;
}

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}
export interface BlacklistNumber {
  _id: string;
  number: string;
}

interface LotteryResult {
  firstPrize: string;
  lastTwoDigits: string;
  threeDigitFront: { round: number; value: string }[];
  threeDigitBack: { round: number; value: string }[];
}

interface LotteryResultResponse {
  success: boolean;
  date: {
    date: string;
    month: string;
    year: string;
  };
  data: LotteryResult;
}

interface LotteryEntry {
  buyerName: string;
  number: string;
  top?: string;
  tod?: string;
  bottom?: string;
}

interface SaveLotteryResponse {
  data: LotteryEntry & { _id: string; createdAt: string };
  createdAtThai: string;
}

 interface CutConfig {
  threeDigitTop: string;
  threeDigitTod: string;
  threeDigitBottom: string;
  twoDigitTop: string;
  twoDigitBottom: string;
}

interface AmountDetail {
  total: string;
  kept: string;
  sent: string;
}

interface EntryItem {
  _id: string;
  buyerName: string;
  number: string;
  top?: AmountDetail;
  top2?: AmountDetail; // ใช้ในกรณี 2 ตัวบน (optional)
  tod?: AmountDetail;
  bottom2?: AmountDetail; // 2 ตัวล่าง (optional)
  bottom3?: AmountDetail; // 3 ตัวล่าง (optional)
  source: "self" | "dealer";
  createdAtThai: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface WinnerType {
  type: string;
  amount: AmountDetail;
}

interface WinnerItem {
  name: string;
  number: string;
  source: "self" | "dealer";
  matchedTypes: WinnerType[];
}

interface WinnerResponse {
  success: boolean;
  date: {
    date: string;
    month: string;
    year: string;
  };
  winners: WinnerItem[];
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
    apiRequest<{ data: Buyers[] }>("/api/buyers", "GET", undefined, token),

  // ✅ เพิ่ม buyer
  addBuyer: (buyer: { name: string; phone: string }, token: string) =>
    apiRequest<{ data: Buyers }>("/api/buyers", "POST", buyer, token),

  // ✅ ลบ buyer
  deleteBuyer: (id: number, token: string) =>
    apiRequest(`/api/buyers/${id}`, "DELETE", undefined, token),

  getBlacklist: (token: string) =>
    apiRequest<{ data: BlacklistNumber[] }>("/api/blocknumber", "GET", undefined, token),

  addBlacklist: (body: { number: string }, token: string) =>
    apiRequest<{ data: BlacklistNumber }>("/api/blocknumber", "POST", body, token),

  updateBlacklist: (id: string, body: { number: string }, token: string) =>
    apiRequest<{ data: BlacklistNumber }>(`/api/blocknumber/${id}`, "PUT", body, token),

  deleteBlacklist: (id: string, token: string) =>
    apiRequest(`/api/blocknumber/${id}`, "DELETE", undefined, token),

  getLotteryResult: () =>
    apiRequest<LotteryResultResponse>("/api/lottery/result", "POST"),

  saveLottery: (entries: LotteryEntry[], token: string) =>
    apiRequest<SaveLotteryResponse[]>("/api/entry/result", "POST", entries, token),

  saveCutConfig: (config: CutConfig, token: string) =>
    apiRequest<{ data: CutConfig }>("/api/cut-config", "POST", config, token),

  getCutConfig: (token: string) =>
    apiRequest<{ data: CutConfig}>("/api/cut-config", "GET", undefined, token),

  getEntriesByBuyer: (buyerName: string, token: string) =>
  apiRequest<{ data: EntryItem[] }>(`/api/entry/by-buyer/${buyerName}`, "GET", undefined, token),

  deleteEntries: (token: string) => apiRequest(`/api/entry/delete`, "POST",undefined, token),
   getWinners: (token: string) => apiRequest<WinnerResponse>("/api/lottery/check-winners", "GET", undefined, token),

   getAll: (token: string) => apiRequest<{ data: EntryItem[] }>("/api/entry/all", "GET", undefined, token),

   deleteEntryPair: (buyerName: string, number: string, token: string) =>
    apiRequest(`/api/entry/deletePair`, "POST", {buyerName, number}, token),

   saveLotteryDealer: (entries: LotteryEntry[], token: string) =>
  apiRequest("/api/entry/lottery/dealer", "POST", entries, token),
};
