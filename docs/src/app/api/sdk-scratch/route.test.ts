import { describe, expect, it } from "vitest";
import { formatScratchSuccessBody } from "./route";

describe("SDK scratch route", () => {
    it("does not force script return values under a result wrapper", () => {
        expect(
            formatScratchSuccessBody({
                vehicles: [
                    {
                        id: 64553,
                        regNo: "1ABC234",
                    },
                ],
            }),
        ).toEqual({
            ok: true,
            vehicles: [
                {
                    id: 64553,
                    regNo: "1ABC234",
                },
            ],
        });
    });

    it("uses data for non-object script return values", () => {
        expect(formatScratchSuccessBody([{ id: 64553 }])).toEqual({
            data: [{ id: 64553 }],
            ok: true,
        });
    });
});
