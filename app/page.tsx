import Link from "next/link";

export default function Main() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f3d7c8_0%,#e6cbbf_28%,#dcc4b9_48%,#cab1a5_100%)] p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col justify-between rounded-[36px] border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur md:min-h-[calc(100vh-3rem)] md:p-10">
        <div className="max-w-3xl space-y-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            OpenAI Support Agent Demo
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            Separate customer chat and support administration into dedicated
            screens.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600">
            Use the customer portal for the end-user conversation. Use the admin
            dashboard for representative actions, conversation review, and
            vector store indexing.
          </p>
        </div>

        <div className="grid gap-4 pt-10 md:grid-cols-2">
          <Link
            href="/customer"
            className="rounded-[28px] bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Customer
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-stone-900">
              Customer View
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Open the customer-facing chat interface only.
            </p>
          </Link>

          <Link
            href="/admin"
            className="rounded-[28px] bg-stone-900 p-6 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              Admin
            </div>
            <h2 className="mt-3 text-2xl font-semibold">
              Support Representative Dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Manage suggested responses, approve actions, and initialize the
              vector store.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
