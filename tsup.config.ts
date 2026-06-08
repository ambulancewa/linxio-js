import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    minify: false,
    dts: true,
    clean: true,
    format: ["cjs", "esm"],
    splitting: false,
});
