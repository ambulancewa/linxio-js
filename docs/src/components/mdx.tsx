import defaultMdxComponents from "fumadocs-ui/mdx";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ReferenceField = {
  allowedValues?: string[];
  defaultValue?: string;
  description: ReactNode;
  name: string;
  required?: boolean;
  type: string;
};

type MethodRow = {
  description?: ReactNode;
  name: string;
  parameters: string;
  returns: string;
};

type ServiceRow = {
  methods: string;
  service: string;
};

function MethodBadge({ method }: { method: string }) {
  const normalized = method.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm border px-1.5 font-mono text-[10px] font-semibold uppercase tracking-normal",
        normalized === "GET" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
        normalized === "POST" &&
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300",
        normalized === "PATCH" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
        normalized === "DELETE" &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300",
      )}
    >
      {normalized}
    </span>
  );
}

/**
 * Compact method header for API and SDK reference pages.
 */
export function ReferenceHeader({
  children,
  method,
  path,
  sdk,
  title,
}: {
  children?: ReactNode;
  method?: string;
  path?: string;
  sdk?: string;
  title: string;
}) {
  return (
    <section className="not-prose my-12 border-b pb-8">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          {method ? <MethodBadge method={method} /> : null}
          <h2 className="m-0 text-2xl font-semibold tracking-normal">
            {title}
          </h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {path ? (
            <code className="rounded-md border bg-fd-muted/50 px-2.5 py-1.5 text-sm">
              {path}
            </code>
          ) : null}
          {sdk ? (
            <code className="rounded-md border bg-fd-muted/50 px-2.5 py-1.5 text-sm">
              {sdk}
            </code>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-fd-muted-foreground">
          {children}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Responsive two-column layout for reference copy and runnable examples.
 */
export function ReferenceGrid({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose mx-auto my-16 grid w-full max-w-[1240px] gap-10 xl:grid-cols-[minmax(0,620px)_minmax(460px,520px)] xl:items-start xl:gap-20">
      {children}
    </div>
  );
}

/**
 * Right-hand example rail for highlighted, copyable MDX code fences.
 */
export function CodeRail({ children }: { children: ReactNode }) {
  return (
    <aside className="linxio-code-rail not-prose space-y-5 xl:sticky xl:top-20 xl:self-start [&_figure]:my-0 [&_pre]:max-h-[min(72vh,760px)] [&_pre]:text-[13px]">
      {children}
    </aside>
  );
}

/**
 * Parameter or response-field table for reference pages.
 */
export function FieldTable({
  fields,
  title = "Parameters",
}: {
  fields: ReferenceField[];
  title?: string;
}) {
  return (
    <section className="not-prose my-10">
      <h2 className="mb-4 text-xl font-semibold tracking-normal">{title}</h2>
      <div className="border-t">
        {fields.map((field) => (
          <div
            className="grid gap-4 border-b py-5 md:grid-cols-[minmax(220px,0.32fr)_1fr]"
            key={field.name}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-[15px] font-semibold">{field.name}</code>
                {field.required ? (
                  <span className="rounded-sm border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600 dark:border-red-900/70 dark:text-red-300">
                    Required
                  </span>
                ) : (
                  <span className="rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-fd-muted-foreground">
                    Optional
                  </span>
                )}
              </div>
              <div className="mt-2 font-mono text-[13px] text-fd-muted-foreground">
                {field.type}
              </div>
            </div>
            <div className="space-y-2 text-[15px] leading-7 text-fd-muted-foreground">
              <div>{field.description}</div>
              {field.defaultValue ? (
                <div>
                  Default: <code>{field.defaultValue}</code>
                </div>
              ) : null}
              {field.allowedValues?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {field.allowedValues.map((value) => (
                    <code
                      className="rounded border bg-fd-muted px-1.5 py-0.5 text-xs"
                      key={value}
                    >
                      {value}
                    </code>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Method signature table for SDK service reference sections.
 */
export function MethodTable({
  rows,
  title = "Methods",
}: {
  rows: MethodRow[];
  title?: string;
}) {
  return (
    <section className="not-prose my-10">
      <h2 className="mb-4 text-xl font-semibold tracking-normal">{title}</h2>
      <div className="border-t">
        {rows.map((row) => (
          <div
            className="grid gap-4 border-b py-5 xl:grid-cols-[minmax(210px,0.34fr)_minmax(180px,0.28fr)_minmax(220px,0.38fr)]"
            key={row.name}
          >
            <div>
              <code className="text-[15px] font-semibold">{row.name}</code>
              {row.description ? (
                <div className="mt-2 text-fd-muted-foreground text-sm leading-6">
                  {row.description}
                </div>
              ) : null}
            </div>
            <code className="overflow-x-auto text-fd-muted-foreground text-xs">
              {row.parameters}
            </code>
            <code className="overflow-x-auto text-fd-muted-foreground text-xs">
              {row.returns}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Compact service surface-area table for the SDK overview reference.
 */
export function ServiceTable({ rows }: { rows: ServiceRow[] }) {
  return (
    <section className="not-prose my-10">
      <h2 className="mb-4 text-xl font-semibold tracking-normal">
        Service Surface
      </h2>
      <div className="border-t">
        {rows.map((row) => (
          <div
            className="grid gap-4 border-b py-5 md:grid-cols-[minmax(190px,0.28fr)_1fr]"
            key={row.service}
          >
            <code className="text-[15px] font-semibold">{row.service}</code>
            <div className="flex flex-wrap gap-1.5">
              {row.methods.split(",").map((method) => (
                <code
                  className="rounded border bg-fd-muted px-1.5 py-0.5 text-xs"
                  key={`${row.service}-${method.trim()}`}
                >
                  {method.trim()}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CodeRail,
    FieldTable,
    MethodTable,
    ReferenceGrid,
    ReferenceHeader,
    ServiceTable,
    pre: ({ ref: _ref, ...props }: ComponentProps<"pre">) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
