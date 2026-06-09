import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { MultiPackageManager } from "@/components/package-manager-install";
import { cn } from "@/lib/cn";
import {
  type JsonHighlightToken,
  tokenizeJsonForHighlight,
} from "@/lib/json-highlight";
import {
  buildReferenceExample,
  findReferenceShape,
  getReferenceShape,
  groupDottedReferenceFields,
  type ReferenceShapeField,
  tokenizeReferenceType,
} from "@/lib/reference-types";

type ReferenceField = {
  allowedValues?: string[];
  children?: ReferenceField[];
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

type FieldTableProps = {
  examplePlacement?: "inline" | "none";
  fields: ReferenceField[];
  title?: string;
};

type ReferenceExample = {
  key: string;
  title: string;
  value: Record<string, unknown>;
};

const maxFieldExpansionDepth = 1;

const jsonTokenClassName: Record<JsonHighlightToken["kind"], string> = {
  boolean: "text-violet-600 dark:text-violet-300",
  key: "text-sky-700 dark:text-sky-300",
  null: "text-rose-600 dark:text-rose-300",
  number: "text-amber-700 dark:text-amber-300",
  plain: "",
  punctuation: "text-fd-muted-foreground/80",
  string: "text-emerald-700 dark:text-emerald-300",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }

  return Math.abs(hash).toString(36);
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
        <div className="m-0 max-w-[600px] text-[15px] text-fd-muted-foreground leading-[1.75]">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function ReferenceGrid({ children }: { children: ReactNode }) {
  const examples = collectReferenceExamples(children);
  const railExamples = examples.map((example) => (
    <ExampleResponse key={example.key} value={example.value} />
  ));
  const displayChildren = railExamples.length
    ? withRailExamples(children, railExamples)
    : children;

  return (
    <div className="not-prose mx-auto my-12 grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-12 xl:[&:has(section[data-hide-title=true])>aside]:-mt-12 [&>*]:min-w-0">
      {displayChildren}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 border-l-4 border-l-blue-700 px-4 pt-1.5 pb-3 pl-5">
      <p className="flex flex-row items-center font-semibold text-blue-700">
        <svg
          data-component="Octicon"
          className="mr-2 size-4"
          viewBox="0 0 16 16"
          version="1.1"
          width="16"
          height="16"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
        </svg>
        Note
      </p>

      <p className="m-0 mt-1 space-y-4 text-fd-muted-foreground text-sm leading-[1.5]">
        {children}
      </p>
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

function collectReferenceExamples(children: ReactNode): ReferenceExample[] {
  const examples: ReferenceExample[] = [];

  visitReactElements(children, (element) => {
    if (!isComponentElement<FieldTableProps>(element, FieldTable)) {
      return;
    }

    const title = element.props.title ?? "Parameters";
    const normalizedFields = normalizeReferenceFields(
      element.props.fields,
      title,
    );
    const value = getReferenceExample(normalizedFields, title);

    if (value) {
      examples.push({
        key: `reference-example-${slugify(title)}-${hashString(
          JSON.stringify(value),
        )}`,
        title,
        value,
      });
    }
  });

  return examples;
}

function withRailExamples(
  children: ReactNode,
  railExamples: ReactNode[],
): ReactNode {
  if (!containsComponent(children, CodeRail)) {
    return children;
  }

  return mapReactElements(children, (element) => {
    if (isComponentElement<{ children?: ReactNode }>(element, CodeRail)) {
      return cloneElement(element, {
        children: (
          <>
            {element.props.children}
            {railExamples}
          </>
        ),
      });
    }

    if (isComponentElement<FieldTableProps>(element, FieldTable)) {
      return cloneElement(element, { examplePlacement: "none" });
    }

    return element;
  });
}

function containsComponent(children: ReactNode, component: unknown): boolean {
  let found = false;

  visitReactElements(children, (element) => {
    if (element.type === component) {
      found = true;
    }
  });

  return found;
}

function visitReactElements(
  node: ReactNode,
  visitor: (element: ReactElement) => void,
) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    visitor(child);
    visitReactElements(getElementChildren(child), visitor);
  });
}

function mapReactElements(
  node: ReactNode,
  visitor: (element: ReactElement) => ReactElement,
): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const children = getElementChildren(child);
    const mappedChildren = children
      ? mapReactElements(children, visitor)
      : children;
    const element =
      mappedChildren && mappedChildren !== children
        ? cloneElement(child as ReactElement<{ children?: ReactNode }>, {
            children: mappedChildren,
          })
        : child;

    return visitor(element);
  });
}

function isComponentElement<Props>(
  element: ReactElement,
  component: unknown,
): element is ReactElement<Props> {
  return element.type === component;
}

function getElementChildren(element: ReactElement): ReactNode | undefined {
  return (element.props as { children?: ReactNode }).children;
}

export function FieldTable({
  examplePlacement = "inline",
  fields,
  title = "Parameters",
}: FieldTableProps) {
  const normalizedFields = normalizeReferenceFields(fields, title);
  const example = getReferenceExample(normalizedFields, title);

  return (
    <section className="not-prose my-8">
      {title ? <h3 className="mb-3 font-bold text-lg">{title}</h3> : null}
      <div className="divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border">
        <FieldRows fields={normalizedFields} tableTitle={title} />
      </div>
      {example && examplePlacement === "inline" ? (
        <div className="mt-4">
          <ExampleResponse value={example} />
        </div>
      ) : null}
    </section>
  );
}

function FieldRows({
  depth = 0,
  expandedTypes = new Set<string>(),
  fields,
  tableTitle,
}: {
  depth?: number;
  expandedTypes?: ReadonlySet<string>;
  fields: ReferenceField[];
  tableTitle: string;
}) {
  return fields.map((field) => {
    const childShape = findReferenceShape(field.type);
    const childFields =
      depth >= maxFieldExpansionDepth
        ? undefined
        : getChildFields(field, expandedTypes, childShape);
    const nextExpandedTypes = childShape
      ? new Set([...expandedTypes, childShape.typeName])
      : expandedTypes;

    return (
      <div
        key={`${depth}-${field.name}`}
        className={cn(
          "grid gap-x-8 gap-y-1 px-4 py-4 transition-colors duration-100 hover:bg-fd-muted/40",
          depth > 0 && "bg-fd-muted/15 px-3 py-3",
        )}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="p-0! font-mono font-semibold text-[13.5px] text-fd-foreground leading-none">
              {field.name}
            </code>

            <div className="break-all font-bold text-[11.5px] text-fd-muted-foreground/80 leading-none leading-relaxed">
              <TypeText type={field.type} />
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
              <span className="text-fd-muted-foreground/70">Default:</span>{" "}
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

          {childFields?.length ? (
            <details className="mt-3 overflow-hidden rounded-md border border-fd-border bg-fd-background">
              <summary className="cursor-pointer select-none px-3 py-2 font-semibold text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                {getChildSummaryLabel(tableTitle)}
              </summary>
              <div className="divide-y divide-fd-border border-fd-border border-t">
                <FieldRows
                  depth={depth + 1}
                  expandedTypes={nextExpandedTypes}
                  fields={childFields}
                  tableTitle={tableTitle}
                />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    );
  });
}

function TypeText({ type }: { type: string }) {
  let offset = 0;

  return tokenizeReferenceType(type).map((token) => {
    const key = `${offset}:${token.text}`;
    offset += token.text.length;

    return token.href ? (
      <a
        className="text-fd-foreground underline decoration-fd-muted-foreground/35 underline-offset-4 transition-colors hover:text-fd-primary hover:decoration-fd-primary/70"
        href={token.href}
        key={key}
      >
        {token.text}
      </a>
    ) : (
      <span key={key}>{token.text}</span>
    );
  });
}

function getChildFields(
  field: ReferenceField,
  expandedTypes: ReadonlySet<string>,
  shape = findReferenceShape(field.type),
): ReferenceField[] | undefined {
  if (field.children?.length && !isReferencePlaceholderList(field.children)) {
    return field.children;
  }

  if (!shape || expandedTypes.has(shape.typeName)) {
    return undefined;
  }

  return shapeFieldsToReferenceFields(shape.fields);
}

function isReferencePlaceholderList(fields: ReferenceField[]) {
  return fields.length === 1 && fields[0]?.name === "__reference";
}

function shapeFieldsToReferenceFields(
  fields: ReferenceShapeField[] | undefined,
): ReferenceField[] | undefined {
  if (!fields) {
    return undefined;
  }

  return fields.map((field) => ({
    ...field,
    children: shapeFieldsToReferenceFields(field.children),
  }));
}

function getChildSummaryLabel(tableTitle: string) {
  const normalized = tableTitle.toLowerCase();

  if (
    normalized.includes("input") ||
    normalized.includes("parameter") ||
    normalized.includes("header") ||
    normalized.includes("body") ||
    normalized.includes("query")
  ) {
    return "Show child parameters";
  }

  return "Show child fields";
}

function getReferenceExample(
  fields: ReferenceField[],
  title: string,
): Record<string, unknown> | undefined {
  if (!shouldShowReferenceExample(title)) {
    return undefined;
  }

  return buildReferenceExample(referenceFieldsToShapeFields(fields));
}

function normalizeReferenceFields(
  fields: ReferenceField[],
  title: string,
): ReferenceField[] {
  return (
    shapeFieldsToReferenceFields(
      groupDottedReferenceFields(
        referenceFieldsToShapeFields(fields),
        shouldShowReferenceExample(title)
          ? "Object field. Expand to see child fields."
          : "Object parameter. Expand to see child parameters.",
      ),
    ) ?? fields
  );
}

function shouldShowReferenceExample(title: string): boolean {
  const normalized = title.toLowerCase();
  return normalized.includes("returns") || normalized.includes("response");
}

function referenceFieldsToShapeFields(
  fields: ReferenceField[],
): ReferenceShapeField[] {
  return fields.map((field) => ({
    ...field,
    description: typeof field.description === "string" ? field.description : "",
    children: field.children
      ? referenceFieldsToShapeFields(field.children)
      : undefined,
  }));
}

function ExampleResponse({ value }: { value: Record<string, unknown> }) {
  const json = JSON.stringify(value, null, 2);
  const tokens = tokenizeJsonForHighlight(json);
  let tokenOffset = 0;

  return (
    <figure className="overflow-hidden rounded-lg border border-fd-border bg-fd-muted/40">
      <figcaption className="border-fd-border border-b px-4 py-2 font-semibold text-[12px] text-fd-muted-foreground uppercase tracking-wide">
        Example response
      </figcaption>
      <pre className="m-0 overflow-x-auto bg-transparent p-4 font-mono text-[13px] text-fd-foreground leading-relaxed">
        <code>
          {tokens.map((token) => {
            const key = `${tokenOffset}:${token.text}`;
            tokenOffset += token.text.length;

            return (
              <span className={jsonTokenClassName[token.kind]} key={key}>
                {token.text}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

export function TypeShape({ typeName }: { typeName: string }) {
  const shape = getReferenceShape(typeName);

  if (!shape) {
    return null;
  }

  return (
    <section id={slugify(typeName)} className="not-prose my-10 scroll-mt-24">
      <h2 className="mb-2 font-bold text-2xl text-fd-foreground leading-snug tracking-tight">
        {typeName}
      </h2>
      <p className="m-0 max-w-[680px] text-[15px] text-fd-muted-foreground leading-[1.75]">
        {shape.description}
      </p>
      <FieldTable
        title="Fields"
        fields={shapeFieldsToReferenceFields(shape.fields) ?? []}
      />
    </section>
  );
}

export function RequiredHeaders({
  auth = true,
  json = false,
}: {
  auth?: boolean;
  json?: boolean;
}) {
  const fields: ReferenceField[] = [];

  if (auth) {
    fields.push({
      name: "Authorization",
      type: "Bearer token",
      required: true,
      description: "JWT bearer token returned by login or token refresh.",
    });
  }

  if (json) {
    fields.push({
      name: "Content-Type",
      type: "application/json",
      required: true,
      description: "Required when sending a JSON request body.",
    });
  }

  if (!fields.length) {
    return null;
  }

  return <FieldTable title="Required headers" fields={fields} />;
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
                <span className="truncate">{row.parameters}</span>
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
    MultiPackageManager,
    RequiredHeaders,
    ServiceTable,
    TypeShape,
    Note,
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
