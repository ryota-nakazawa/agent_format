import Link from "next/link";
import UserView from "@/components/UserView";

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7efe7_0%,#efe4d6_100%)] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-4 md:min-h-[calc(100vh-3rem)]">
        <header className="flex flex-col gap-3 rounded-3xl bg-white/90 px-6 py-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Customer Portal
            </div>
            <h1 className="text-2xl font-semibold text-stone-900">
              Customer View
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              Home
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              Admin
            </Link>
          </nav>
        </header>

        <div className="flex-1 overflow-hidden rounded-[28px] border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur">
          <UserView />
        </div>
      </div>
    </div>
  );
}
