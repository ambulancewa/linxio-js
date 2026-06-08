import Link from "next/link";

const features = [
  {
    title: "Typed results",
    description:
      "Every service method returns { data, error } — branch without try/catch.",
  },
  {
    title: "Auto-pagination",
    description:
      "iterate() collects all pages. stream() yields one record at a time.",
  },
  {
    title: "Resilient by default",
    description:
      "Configurable timeout, retry, and automatic 401 token refresh.",
  },
  {
    title: "Drop to raw requests",
    description:
      "linxio.request() for any endpoint not covered by a domain service.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col justify-center px-6 py-20 md:py-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-fd-muted-foreground">
        linxio-js
      </p>
      <h1 className="mb-5 text-4xl font-semibold tracking-tight text-fd-foreground md:text-5xl">
        Build fleet scripts and services{" "}
        <span className="text-fd-muted-foreground font-normal">
          against the Linxio API
        </span>
      </h1>
      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-fd-muted-foreground">
        Authenticate once, use domain services for common workflows, load or
        stream paginated results, and drop down to raw requests for
        tenant-specific endpoints.
      </p>

      <div className="mb-12 flex flex-wrap gap-3">
        <Link
          href="/docs/getting-started"
          className="inline-flex h-10 items-center rounded-lg bg-fd-primary px-5 text-[14px] font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/docs/sdk-reference"
          className="inline-flex h-10 items-center rounded-lg border border-fd-border px-5 text-[14px] font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
        >
          SDK Reference
        </Link>
        <Link
          href="/docs/api-reference"
          className="inline-flex h-10 items-center rounded-lg border border-fd-border px-5 text-[14px] font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
        >
          API Reference
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-fd-border p-5 transition-colors hover:bg-fd-muted/40"
          >
            <p className="mb-1.5 text-[14px] font-semibold text-fd-foreground">
              {f.title}
            </p>
            <p className="text-[14px] leading-relaxed text-fd-muted-foreground">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-fd-border pt-10">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-fd-muted-foreground">
          Quick install
        </p>
        <pre className="inline-block rounded-lg border border-fd-border bg-fd-muted/50 px-5 py-3 font-mono text-[13px] text-fd-foreground">
          pnpm add linxio-js
        </pre>
      </div>
    </main>
  );
}
