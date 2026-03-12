import { promises as fs } from "fs";
import path from "path";
import type {
  InquiryCategory,
  InquiryMessage,
  InquiryPriority,
  InquiryRecord,
} from "@/lib/inquiries-types";

interface ClassifierResult {
  category: InquiryCategory;
  priority: InquiryPriority;
  recommendedContactEmail: string | null;
  routeReason: string | null;
}

interface UpsertInquiryInput {
  inquiryId?: string | null;
  customerId: string;
  customerName: string;
  userMessage?: string;
  assistantMessage?: string;
  toolMessage?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INQUIRIES_PATH = path.join(DATA_DIR, "inquiries.json");

const CONTACTS: Record<
  Exclude<InquiryCategory, "general"> | "general",
  { email: string; reason: string }
> = {
  billing: {
    email: "billing@example.com",
    reason: "billing, payments, refunds, and voucher requests",
  },
  orders: {
    email: "orders@example.com",
    reason: "shipping, returns, exchanges, and damaged deliveries",
  },
  account: {
    email: "accounts@example.com",
    reason: "account access, password, security, and profile changes",
  },
  technical: {
    email: "tech@example.com",
    reason: "technical bugs and system errors",
  },
  complaint: {
    email: "support@example.com",
    reason: "complaints and special-case manual follow-up",
  },
  general: {
    email: "support@example.com",
    reason: "general support requests that need human follow-up",
  },
};

const createMessage = (
  role: InquiryMessage["role"],
  text: string
): InquiryMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  role,
  text,
  createdAt: new Date().toISOString(),
});

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(INQUIRIES_PATH);
  } catch {
    await fs.writeFile(INQUIRIES_PATH, "[]", "utf8");
  }
};

export const readInquiries = async (): Promise<InquiryRecord[]> => {
  await ensureStore();
  const content = await fs.readFile(INQUIRIES_PATH, "utf8");
  const parsed = JSON.parse(content) as InquiryRecord[];
  return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const writeInquiries = async (inquiries: InquiryRecord[]) => {
  await ensureStore();
  await fs.writeFile(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2), "utf8");
};

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

export const classifyInquiry = (text: string): ClassifierResult => {
  const normalized = text.toLowerCase();

  if (
    includesAny(normalized, [
      "refund",
      "billing",
      "payment",
      "charge",
      "voucher",
      "返金",
      "請求",
      "支払い",
      "決済",
      "課金",
      "バウチャー",
      "クーポン",
    ])
  ) {
    return {
      category: "billing",
      priority: "medium",
      recommendedContactEmail: CONTACTS.billing.email,
      routeReason: CONTACTS.billing.reason,
    };
  }

  if (
    includesAny(normalized, [
      "delivery",
      "shipping",
      "return",
      "exchange",
      "damaged",
      "order",
      "配送",
      "返品",
      "交換",
      "破損",
      "注文",
      "荷物",
      "遅延",
    ])
  ) {
    return {
      category: "orders",
      priority: includesAny(normalized, ["damaged", "破損", "urgent", "至急"])
        ? "high"
        : "medium",
      recommendedContactEmail: CONTACTS.orders.email,
      routeReason: CONTACTS.orders.reason,
    };
  }

  if (
    includesAny(normalized, [
      "password",
      "login",
      "account",
      "security",
      "profile",
      "reset",
      "パスワード",
      "ログイン",
      "アカウント",
      "セキュリティ",
      "プロフィール",
      "登録情報",
    ])
  ) {
    return {
      category: "account",
      priority: includesAny(normalized, ["security", "セキュリティ", "不正"])
        ? "high"
        : "medium",
      recommendedContactEmail: CONTACTS.account.email,
      routeReason: CONTACTS.account.reason,
    };
  }

  if (
    includesAny(normalized, [
      "bug",
      "error",
      "broken",
      "crash",
      "not working",
      "不具合",
      "エラー",
      "動かない",
      "バグ",
      "クラッシュ",
    ])
  ) {
    return {
      category: "technical",
      priority: "high",
      recommendedContactEmail: CONTACTS.technical.email,
      routeReason: CONTACTS.technical.reason,
    };
  }

  if (
    includesAny(normalized, [
      "complaint",
      "angry",
      "terrible",
      "クレーム",
      "苦情",
      "最悪",
    ])
  ) {
    return {
      category: "complaint",
      priority: "high",
      recommendedContactEmail: CONTACTS.complaint.email,
      routeReason: CONTACTS.complaint.reason,
    };
  }

  return {
    category: "general",
    priority: "low",
    recommendedContactEmail: CONTACTS.general.email,
    routeReason: CONTACTS.general.reason,
  };
};

export const upsertInquiry = async ({
  inquiryId,
  customerId,
  customerName,
  userMessage,
  assistantMessage,
  toolMessage,
}: UpsertInquiryInput): Promise<InquiryRecord> => {
  const inquiries = await readInquiries();
  const now = new Date().toISOString();

  let inquiry = inquiryId
    ? inquiries.find((item) => item.id === inquiryId) ?? null
    : null;

  if (!inquiry) {
    const seedText = userMessage || assistantMessage || toolMessage || "";
    const classification = classifyInquiry(seedText);
    inquiry = {
      id: inquiryId || `inq_${Date.now().toString(36)}`,
      customerId,
      customerName,
      category: classification.category,
      priority: classification.priority,
      status: "open",
      summary: seedText.slice(0, 120),
      recommendedContactEmail: classification.recommendedContactEmail,
      routeReason: classification.routeReason,
      createdAt: now,
      updatedAt: now,
      lastUserMessage: userMessage || "",
      lastAssistantMessage: assistantMessage || "",
      messageCount: 0,
      messages: [],
    };
    inquiries.push(inquiry);
  }

  if (userMessage) {
    const classification = classifyInquiry(userMessage);
    inquiry.category = classification.category;
    inquiry.priority = classification.priority;
    inquiry.summary = userMessage.slice(0, 120);
    inquiry.lastUserMessage = userMessage;
    inquiry.recommendedContactEmail = classification.recommendedContactEmail;
    inquiry.routeReason = classification.routeReason;
    inquiry.messages.push(createMessage("user", userMessage));
  }

  if (assistantMessage) {
    inquiry.lastAssistantMessage = assistantMessage;
    inquiry.messages.push(createMessage("assistant", assistantMessage));
    inquiry.status = assistantMessage.includes("@example.com")
      ? "routed"
      : inquiry.status === "routed"
        ? "routed"
        : "open";
  }

  if (toolMessage) {
    inquiry.messages.push(createMessage("tool", toolMessage));
    if (inquiry.status !== "routed") {
      inquiry.status = "automated";
    }
  }

  inquiry.updatedAt = now;
  inquiry.messageCount = inquiry.messages.length;

  await writeInquiries(inquiries);
  return inquiry;
};
