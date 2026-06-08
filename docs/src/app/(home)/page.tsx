import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium text-fd-muted-foreground">
        TypeScript SDK for Linxio
      </p>
      <h1 className="mb-4 text-4xl font-semibold tracking-tight">
        Build fleet scripts and services against Linxio with typed, resilient
        APIs.
      </h1>
      <p className="mb-8 text-lg text-fd-muted-foreground">
        Authenticate once, use domain services for common workflows, load or
        stream paginated results, and drop down to raw requests for
        tenant-specific endpoints.
      </p>
      <p>
        <Link href="/docs" className="font-medium underline">
          Open the documentation
        </Link>
      </p>
    </main>
  );
}
