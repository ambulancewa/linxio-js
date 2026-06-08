#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
    compareDashboardEndpointCoverage,
    extractDashboardEndpoints,
    flattenEndpointDefinitions,
    linxioEndpoints,
} from "../dist/index.js";

const sourceDir =
    process.argv.at(2) && !process.argv.at(2)?.startsWith("--")
        ? process.argv.at(2)
        : "sources";
const outputJson = process.argv.includes("--json");
const files = (await readdir(sourceDir))
    .filter((filename) => filename.endsWith(".js"))
    .sort();
const sources = await Promise.all(
    files.map(async (filename) => ({
        content: await readFile(join(sourceDir, filename), "utf8"),
        filename,
    })),
);
const dashboardEndpoints = extractDashboardEndpoints(sources);
const sdkEndpoints = flattenEndpointDefinitions(linxioEndpoints);
const comparison = compareDashboardEndpointCoverage({
    dashboardEndpoints,
    sdkEndpoints,
});
const summary = {
    dashboardCovered: comparison.dashboardCovered.length,
    dashboardOnly: comparison.dashboardOnly.length,
    extractedDashboardEndpoints: dashboardEndpoints.length,
    sdkEndpointDefinitions: sdkEndpoints.length,
    sdkOnly: comparison.sdkOnly.length,
    sourceFiles: files.length,
};

if (outputJson) {
    console.log(
        JSON.stringify(
            {
                dashboardOnly: comparison.dashboardOnly,
                sdkOnly: comparison.sdkOnly,
                summary,
            },
            null,
            2,
        ),
    );
} else {
    console.log("# Linxio Dashboard Source Analysis");
    console.log("");
    console.log(`- Source files analysed: ${summary.sourceFiles}`);
    console.log(
        `- Dashboard endpoint candidates extracted: ${summary.extractedDashboardEndpoints}`,
    );
    console.log(
        `- SDK endpoint definitions: ${summary.sdkEndpointDefinitions}`,
    );
    console.log(
        `- Dashboard candidates covered by the SDK catalogue: ${summary.dashboardCovered}`,
    );
    console.log(
        `- Dashboard candidates not yet represented in the SDK catalogue: ${summary.dashboardOnly}`,
    );
    console.log(
        `- SDK catalogue entries not observed in these dashboard bundles: ${summary.sdkOnly}`,
    );
    console.log("");
    console.log("## Dashboard-only candidates");
    console.log("");
    console.log("| Methods | Path | Files |");
    console.log("| --- | --- | --- |");

    for (const endpoint of comparison.dashboardOnly.slice(0, 80)) {
        console.log(
            `| ${endpoint.methods.join(", ")} | \`${endpoint.path}\` | ${endpoint.files.join(", ")} |`,
        );
    }

    if (comparison.dashboardOnly.length > 80) {
        console.log("");
        console.log(
            `Showing 80 of ${comparison.dashboardOnly.length} dashboard-only candidates. Re-run with --json for the full machine-readable list.`,
        );
    }
}
