import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    environment: "node",
                    include: ["src/**/*.test.ts"],
                    name: "sdk",
                },
            },
            "./docs",
        ],
    },
});
