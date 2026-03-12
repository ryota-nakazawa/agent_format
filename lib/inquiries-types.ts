export type InquiryCategory =
  | "billing"
  | "orders"
  | "account"
  | "technical"
  | "complaint"
  | "general";

export type InquiryPriority = "low" | "medium" | "high";
export type InquiryStatus = "open" | "automated" | "routed";

export interface InquiryMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  createdAt: string;
}

export interface InquiryRecord {
  id: string;
  customerId: string;
  customerName: string;
  category: InquiryCategory;
  priority: InquiryPriority;
  status: InquiryStatus;
  summary: string;
  recommendedContactEmail: string | null;
  routeReason: string | null;
  createdAt: string;
  updatedAt: string;
  lastUserMessage: string;
  lastAssistantMessage: string;
  messageCount: number;
  messages: InquiryMessage[];
}
