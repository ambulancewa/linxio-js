import { describe, expect, it } from "vitest";
import {
    buildReferenceExample,
    findReferenceShape,
    getReferenceEnumValues,
    getReferenceTypeHref,
    getReferenceTypeNames,
    groupDottedReferenceFields,
    type ReferenceShapeField,
    tokenizeReferenceType,
} from "./reference-types";

describe("reference type helpers", () => {
    it("extracts known bespoke type names from array and nullable unions", () => {
        expect(getReferenceTypeNames("LinxioVehicle[] | null")).toEqual([
            "LinxioVehicle",
        ]);
        expect(
            getReferenceTypeNames("Promise<LinxioResult<LinxioVehicle>>"),
        ).toEqual(["LinxioResult", "LinxioVehicle"]);
    });

    it("ignores primitive and free-form collection types", () => {
        expect(getReferenceTypeNames("string[] | null")).toEqual([]);
        expect(findReferenceShape("JsonValue[] | null")).toBeUndefined();
    });

    it("resolves linked type pages and nested child fields", () => {
        expect(getReferenceTypeHref("LinxioVehicle")).toBe(
            "/docs/sdk-reference/types#linxiovehicle",
        );

        const shape = findReferenceShape("LinxioVehicle[] | null");
        expect(shape?.typeName).toBe("LinxioVehicle");
        expect(shape?.fields.map((field) => field.name)).toContain(
            "lastCoordinates",
        );
        expect(
            shape?.fields
                .find((field) => field.name === "todayData")
                ?.children?.map((field) => field.name),
        ).toEqual(["avgSpeed", "distance", "duration", "idleDuration"]);
    });

    it("tokenizes type text without losing punctuation around linked types", () => {
        expect(tokenizeReferenceType("LinxioVehicle[] | null")).toEqual([
            {
                text: "LinxioVehicle",
                href: "/docs/sdk-reference/types#linxiovehicle",
            },
            { text: "[] | null" },
        ]);
    });

    it("resolves enum values from scalar and array type text", () => {
        expect(
            getReferenceEnumValues("VehicleField[]")?.map((v) => v.value),
        ).toEqual([
            "id",
            "regNo",
            "defaultLabel",
            "model",
            "depot",
            "groups",
            "driver",
            "type",
            "typeId",
            "typeName",
            "make",
            "makeModel",
            "vin",
            "deviceId",
            "status",
            "lastLoggedAt",
            "lastCoordinates",
            "todayData",
        ]);

        expect(
            getReferenceEnumValues("LinxioFileFormat")?.map((v) => v.value),
        ).toEqual(["csv", "pdf", "xlsx"]);
    });

    it("uses concrete enum metadata on typed list parameter shapes", () => {
        const shape = findReferenceShape("LinxioVehicleListParams");
        const fields = shape?.fields.find((field) => field.name === "fields");

        expect(fields?.type).toBe("VehicleField[]");
        expect(fields?.enumValues?.map((value) => value.value)).toContain(
            "lastCoordinates",
        );
    });

    it("preserves unlinked capitalized type names as plain text", () => {
        expect(tokenizeReferenceType("ISODateString | null")).toEqual([
            { text: "ISODateString | null" },
        ]);
    });

    it("builds nested JSON examples from return field metadata", () => {
        const fields: ReferenceShapeField[] = [
            {
                name: "data",
                type: "LinxioVehicle[] | null",
                description: "Vehicles for the requested page.",
            },
            {
                name: "meta",
                type: "LinxioPaginationMeta | null",
                description: "Pagination metadata.",
            },
            {
                name: "error",
                type: "LinxioError | null",
                description: "Typed SDK error.",
            },
        ];

        expect(buildReferenceExample(fields)).toMatchObject({
            data: [
                {
                    id: 304,
                    lastCoordinates: {
                        lat: -31.9523,
                        lng: 115.8613,
                    },
                    regNo: "AMB-304",
                    todayData: {
                        avgSpeed: 62,
                        distance: 12750,
                        duration: 5400,
                    },
                },
            ],
            error: null,
            meta: {
                limit: 100,
                page: 1,
                total: 2,
            },
        });
    });

    it("builds examples for linked auth response shapes", () => {
        expect(
            buildReferenceExample([
                {
                    name: "data",
                    type: "LinxioLoginResponse",
                    description:
                        "The same session shape returned by auth.login().",
                },
                {
                    name: "error",
                    type: "LinxioError | null",
                    description: "Typed SDK error.",
                },
            ]),
        ).toMatchObject({
            data: {
                refreshToken: "refresh_token",
                token: "jwt_token",
            },
            error: null,
        });
    });

    it("builds dotted response field examples as nested objects", () => {
        expect(
            buildReferenceExample([
                {
                    name: "data.odometer",
                    type: "number",
                    description: "Odometer reading.",
                },
                {
                    name: "data.vehicleId",
                    type: "LinxioId",
                    description: "Vehicle identifier.",
                },
            ]),
        ).toEqual({
            data: {
                odometer: 123456,
                vehicleId: 304,
            },
        });
    });

    it("groups dotted object fields into expandable parent fields", () => {
        expect(
            groupDottedReferenceFields([
                {
                    name: "payload.regNo",
                    type: "string",
                    description: "Registration number.",
                },
                {
                    name: "payload.defaultLabel",
                    type: "string",
                    description: "Display label.",
                },
                {
                    name: "vehicleId",
                    type: "LinxioId",
                    description: "Vehicle identifier.",
                },
            ]),
        ).toEqual([
            {
                children: [
                    {
                        name: "regNo",
                        type: "string",
                        description: "Registration number.",
                    },
                    {
                        name: "defaultLabel",
                        type: "string",
                        description: "Display label.",
                    },
                ],
                description:
                    "Object parameter. Expand to see child parameters.",
                name: "payload",
                type: "object",
            },
            {
                name: "vehicleId",
                type: "LinxioId",
                description: "Vehicle identifier.",
            },
        ]);
    });
});
