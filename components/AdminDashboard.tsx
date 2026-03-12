"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { InquiryRecord } from "@/lib/inquiries-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  open: "#7c6f64",
  automated: "#2f855a",
  routed: "#c05621",
};

const PRIORITY_STYLES = {
  low: "bg-stone-100 text-stone-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const CATEGORY_LABELS: Record<InquiryRecord["category"], string> = {
  billing: "Billing",
  orders: "Orders",
  account: "Account",
  technical: "Technical",
  complaint: "Complaint",
  general: "General",
};

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/inquiries", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        setInquiries(data.inquiries ?? []);
        if (!selectedInquiryId && data.inquiries?.length > 0) {
          setSelectedInquiryId(data.inquiries[0].id);
        }
      } catch (error) {
        console.error("Failed to load inquiries:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedInquiryId]);

  const selectedInquiry = useMemo(
    () =>
      inquiries.find((inquiry) => inquiry.id === selectedInquiryId) ??
      inquiries[0] ??
      null,
    [inquiries, selectedInquiryId]
  );

  const metrics = useMemo(() => {
    const total = inquiries.length;
    const open = inquiries.filter((item) => item.status === "open").length;
    const routed = inquiries.filter((item) => item.status === "routed").length;
    const automated = inquiries.filter(
      (item) => item.status === "automated"
    ).length;
    const avgMessages =
      total === 0
        ? 0
        : inquiries.reduce((sum, item) => sum + item.messageCount, 0) / total;

    return {
      total,
      open,
      routed,
      automated,
      avgMessages: avgMessages.toFixed(1),
    };
  }, [inquiries]);

  const categoryData = useMemo(
    () =>
      Object.entries(
        inquiries.reduce<Record<string, number>>((acc, inquiry) => {
          acc[inquiry.category] = (acc[inquiry.category] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([category, count]) => ({
        name: CATEGORY_LABELS[category as InquiryRecord["category"]],
        count,
      })),
    [inquiries]
  );

  const statusData = useMemo(
    () =>
      Object.entries(
        inquiries.reduce<Record<string, number>>((acc, inquiry) => {
          acc[inquiry.status] = (acc[inquiry.status] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({
        name: status,
        count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      })),
    [inquiries]
  );

  const dailyTrend = useMemo(() => {
    const grouped = inquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const date = inquiry.createdAt.slice(5, 10);
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [inquiries]);

  return (
    <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_420px]">
      <div className="flex min-h-0 flex-col gap-4">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total inquiries" value={String(metrics.total)} />
          <MetricCard label="Open" value={String(metrics.open)} />
          <MetricCard label="Routed" value={String(metrics.routed)} />
          <MetricCard
            label="Avg. messages"
            value={String(metrics.avgMessages)}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="By category">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd6" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c6f64" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status mix">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <ChartCard title="Incoming trend">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd6" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#c05621" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="min-h-0 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Inquiry Log
              </div>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">
                Recent inquiries
              </h2>
            </div>
            <div className="text-sm text-stone-500">
              {loading ? "Loading..." : `${inquiries.length} records`}
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
              No inquiries yet. Customer conversations will appear here.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200">
              <div className="grid grid-cols-[1.3fr_0.8fr_0.6fr_0.8fr] gap-4 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <div>Summary</div>
                <div>Category</div>
                <div>Status</div>
                <div>Updated</div>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {inquiries.map((inquiry) => (
                  <button
                    key={inquiry.id}
                    type="button"
                    onClick={() => setSelectedInquiryId(inquiry.id)}
                    className={`grid w-full grid-cols-[1.3fr_0.8fr_0.6fr_0.8fr] gap-4 border-t border-stone-100 px-4 py-4 text-left transition-colors hover:bg-stone-50 ${
                      selectedInquiry?.id === inquiry.id ? "bg-stone-50" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-stone-900">
                        {inquiry.summary || "(No summary)"}
                      </div>
                      <div className="mt-1 text-sm text-stone-500">
                        {inquiry.customerName}
                      </div>
                    </div>
                    <div className="text-sm text-stone-700">
                      {CATEGORY_LABELS[inquiry.category]}
                    </div>
                    <div>
                      <StatusBadge status={inquiry.status} />
                    </div>
                    <div className="text-sm text-stone-500">
                      {new Date(inquiry.updatedAt).toLocaleString("ja-JP")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="flex min-h-0 flex-col gap-4">
        <section className="min-h-0 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Inquiry Detail
          </div>
          {selectedInquiry ? (
            <div className="mt-4 flex h-full min-h-0 flex-col gap-4">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedInquiry.status} />
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[selectedInquiry.priority]}`}
                  >
                    {selectedInquiry.priority} priority
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-stone-900">
                  {selectedInquiry.summary}
                </h3>
                <div className="mt-3 space-y-1 text-sm text-stone-600">
                  <div>Customer: {selectedInquiry.customerName}</div>
                  <div>Customer ID: {selectedInquiry.customerId}</div>
                  <div>Category: {CATEGORY_LABELS[selectedInquiry.category]}</div>
                  <div>
                    Routed contact:{" "}
                    {selectedInquiry.recommendedContactEmail ?? "Not routed"}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 rounded-2xl border border-stone-200">
                <div className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
                  Conversation log
                </div>
                <div className="max-h-[520px] space-y-3 overflow-y-auto px-4 py-4">
                  {selectedInquiry.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-stone-900 text-white"
                          : message.role === "assistant"
                            ? "bg-stone-100 text-stone-800"
                            : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      <div className="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">
                        {message.role}
                      </div>
                      <div>{message.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
              Select an inquiry to inspect details.
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-stone-900">{value}</div>
    </section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Dashboard
      </div>
      <h2 className="mt-2 text-lg font-semibold text-stone-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: InquiryRecord["status"] }) {
  const labels = {
    open: "Open",
    automated: "Automated",
    routed: "Routed",
  };

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {labels[status]}
    </span>
  );
}
