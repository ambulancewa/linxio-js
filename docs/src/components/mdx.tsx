import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
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

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function MethodBadge({ method }: { method: string }) {
    const normalized = method.toUpperCase();

    return (
        <span
            className={cn(
                "inline-flex h-[26px] shrink-0 items-center rounded px-[7px] font-bold font-mono text-sm uppercase leading-none tracking-wide",
                normalized === "GET" &&
                    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 ring-inset dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/60",
                normalized === "POST" &&
                    "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 ring-inset dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/60",
                normalized === "PATCH" &&
                    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 ring-inset dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/60",
                normalized === "PUT" &&
                    "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80 ring-inset dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-800/60",
                normalized === "DELETE" &&
                    "bg-red-50 text-red-700 ring-1 ring-red-200/80 ring-inset dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800/60",
            )}
        >
            {normalized}
        </span>
    );
}

export function ReferenceHeader({
    children,
    method,
    path,
    sdk,
    title,
    hideTitle = false,
}: {
    children?: ReactNode;
    method?: string;
    path?: string;
    sdk?: string;
    title: string;
    hideTitle?: boolean;
}) {
    const id = slugify(title);

    return (
        <section
            id={id}
            className={cn(
                "not-prose mb-7 scroll-mt-24",
                hideTitle && "-mt-12 [&>aside+*]:-mt-12",
            )}
            {...(hideTitle && { "data-hide-title": true })}
        >
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
                {method ? <MethodBadge method={method} /> : null}
                {hideTitle ? null : (
                    <h2 className="m-0 font-bold text-2xl text-fd-foreground leading-snug tracking-tight">
                        {title}
                    </h2>
                )}
            </div>

            {(path ?? sdk) ? (
                <div className="mb-4 flex flex-wrap gap-2">
                    {path ? (
                        <code className="inline-flex items-center rounded-md border border-fd-border bg-fd-muted/60 px-3 py-[7px] font-mono text-[12.5px] text-fd-muted-foreground leading-none">
                            {path}
                        </code>
                    ) : null}
                    {sdk ? (
                        <code className="inline-flex items-center rounded-md border border-fd-border bg-fd-muted/60 px-3 py-[7px] font-mono text-[12.5px] text-fd-muted-foreground leading-none">
                            {sdk}
                        </code>
                    ) : null}
                </div>
            ) : null}

            {children ? (
                <p className="m-0 max-w-[600px] text-[15px] text-fd-muted-foreground leading-[1.75]">
                    {children}
                </p>
            ) : null}
        </section>
    );
}

export function ReferenceGrid({ children }: { children: ReactNode }) {
    return (
        <div className="not-prose mx-auto my-12 grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-12 xl:[&:has(section[data-hide-title=true])>aside]:-mt-12 [&>*]:min-w-0">
            {children}
        </div>
    );
}

export function CodeRail({ children }: { children: ReactNode }) {
    return (
        <aside className="peer/code-rail linxio-code-rail not-prose space-y-4 xl:sticky xl:top-20 xl:self-start [&_figure]:my-0 [&_pre]:max-h-[min(72vh,720px)] [&_pre]:text-[13px]">
            {children}
        </aside>
    );
}

export function FieldTable({
    fields,
    title = "Parameters",
}: {
    fields: ReferenceField[];
    title?: string;
}) {
    return (
        <section className="not-prose my-8">
            {title ? <h3 className="mb-3 font-bold text-lg">{title}</h3> : null}
            <div className="divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border">
                {fields.map((field) => (
                    <div
                        key={field.name}
                        className="grid gap-x-8 gap-y-1 px-4 py-4 transition-colors duration-100 hover:bg-fd-muted/40"
                    >
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <code className="p-0! font-mono font-semibold text-[13.5px] text-fd-foreground leading-none">
                                    {field.name}
                                </code>

                                <div className="break-all font-bold text-[11.5px] text-fd-muted-foreground/80 leading-none leading-relaxed">
                                    {field.type}
                                </div>

                                {field.required ? (
                                    <span className="rounded border border-red-200/80 bg-red-50 px-1.5 py-[3px] font-semibold text-[10px] text-red-600 uppercase leading-none tracking-wide dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                        required
                                    </span>
                                ) : (
                                    <span className="rounded border border-fd-border px-1.5 py-[3px] font-semibold text-[10px] text-fd-muted-foreground uppercase leading-none tracking-wide">
                                        optional
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-[14px] text-fd-muted-foreground leading-relaxed">
                            <div>{field.description}</div>

                            {field.defaultValue ? (
                                <div className="mt-0.5 text-[13px]">
                                    <span className="text-fd-muted-foreground/70">
                                        Default:
                                    </span>{" "}
                                    <code className="rounded bg-fd-muted px-1.5 py-[3px] font-mono text-[12px]">
                                        {field.defaultValue}
                                    </code>
                                </div>
                            ) : null}

                            {field.allowedValues?.length ? (
                                <div className="mt-0.5 flex flex-wrap gap-1.5">
                                    {field.allowedValues.map((v) => (
                                        <code
                                            key={v}
                                            className="rounded-md border border-fd-border bg-fd-muted/60 px-2 py-1 font-mono text-[11.5px]"
                                        >
                                            {v}
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

export function MethodTable({
    rows,
    title = "Methods",
}: {
    rows: MethodRow[];
    title?: string;
}) {
    return (
        <section className="not-prose my-8">
            {title ? (
                <div className="mb-3">
                    <span className="font-semibold text-[11px] text-fd-muted-foreground uppercase tracking-widest">
                        {title}
                    </span>
                </div>
            ) : null}
            <div className="divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border">
                {rows.map((row) => (
                    <div
                        key={row.name}
                        className="px-4 py-3.5 transition-colors duration-100 hover:bg-fd-muted/40"
                    >
                        <div className="flex flex-wrap items-start gap-x-5 gap-y-1.5">
                            <code className="shrink-0 font-mono font-semibold text-[13.5px] text-fd-foreground">
                                {row.name}
                            </code>
                            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-fd-muted-foreground/80">
                                <span className="truncate">
                                    {row.parameters}
                                </span>
                                <span className="select-none text-fd-muted-foreground/40">
                                    →
                                </span>
                                <span className="truncate">{row.returns}</span>
                            </div>
                        </div>
                        {row.description ? (
                            <p className="mt-1.5 text-[13px] text-fd-muted-foreground leading-relaxed">
                                {row.description}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </section>
    );
}

export function ServiceTable({ rows }: { rows: ServiceRow[] }) {
    return (
        <section className="not-prose my-8">
            <div className="mb-3">
                <span className="font-semibold text-[11px] text-fd-muted-foreground uppercase tracking-widest">
                    Service Surface
                </span>
            </div>
            <div className="divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border">
                {rows.map((row) => (
                    <div
                        key={row.service}
                        className="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 py-4 transition-colors duration-100 hover:bg-fd-muted/40"
                    >
                        <code className="min-w-[160px] shrink-0 font-mono font-semibold text-[13.5px] text-fd-foreground">
                            {row.service}
                        </code>
                        <div className="flex flex-wrap gap-1.5">
                            {row.methods.split(",").map((m) => (
                                <code
                                    key={`${row.service}-${m.trim()}`}
                                    className="rounded-md border border-fd-border bg-fd-muted/60 px-2 py-1 font-mono text-[11.5px] text-fd-muted-foreground"
                                >
                                    {m.trim()}
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
