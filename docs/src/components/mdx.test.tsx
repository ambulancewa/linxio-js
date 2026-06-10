import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FieldTable } from "./mdx";

type FieldTableField = ComponentProps<typeof FieldTable>["fields"][number];

function makeChildFields(count: number): FieldTableField[] {
    return Array.from({ length: count }, (_, index) => {
        const fieldNumber = index + 1;

        return {
            name: `childField${fieldNumber}`,
            type: "string | null",
            description: `Child field ${fieldNumber}.`,
        };
    });
}

describe("FieldTable", () => {
    it("adds a reveal control when a child field list has more than 30 fields", () => {
        const html = renderToStaticMarkup(
            <FieldTable
                title="Returns"
                fields={[
                    {
                        name: "data",
                        type: "object",
                        description: "Response data.",
                        children: makeChildFields(35),
                    },
                ]}
            />,
        );

        expect(html).toContain("Show 5 more");
    });
});
