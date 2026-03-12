import Link from "next/link";
import AdminDashboard from "@/components/AdminDashboard";
import VectorStoreManager from "@/components/VectorStoreManager";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e6ded4_0%,#d7cbc0_100%)] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-4 md:min-h-[calc(100vh-3rem)]">
        <header className="rounded-3xl bg-stone-900 px-6 py-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                Admin Console
              </div>
              <h1 className="text-2xl font-semibold">
                Inquiry Management Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
                Track incoming inquiries, review message history, and refresh
                the knowledge base index from one place.
              </p>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-800"
              >
                Home
              </Link>
              <Link
                href="/customer"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
              >
                Customer View
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 flex-col gap-4">
          <AdminDashboard />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Operations
              </div>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">
                Admin Notes
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Customer conversations are recorded in a local JSON file for this
                demo. Upload additional materials here, then rebuild the vector
                store from both built-in KB content and uploaded files. Keep
                `VECTOR_STORE_ID` current in `config/constants.ts`.
              </p>
            </section>
            <VectorStoreManager />
          </div>
        </div>
      </div>
    </div>
  );
}
