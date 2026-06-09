import type React from "react";
import { useState } from "react";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

interface MultiPackageManagerProps {
    packageName: string;
    isDev?: boolean;
}

export const MultiPackageManager: React.FC<MultiPackageManagerProps> = ({
    packageName,
    isDev = false,
}) => {
    const [activeManager, setActiveManager] = useState<PackageManager>("npm");
    const [copied, setCopied] = useState(false);

    const flag = isDev ? "-D" : "";

    const commands: Record<PackageManager, string> = {
        npm: `npm install ${flag} ${packageName}`.trim(),
        yarn: `yarn add ${flag} ${packageName}`.trim(),
        pnpm: `pnpm add ${flag} ${packageName}`.trim(),
        bun: `bun add ${flag} ${packageName}`.trim(),
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(commands[activeManager]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-xl overflow-hidden rounded-lg border border-gray-700 bg-gray-900 font-sans text-gray-200 shadow-xl">
            {/* Tab Headers */}
            <div className="flex border-gray-700 border-b bg-gray-800">
                {(Object.keys(commands) as PackageManager[]).map((manager) => (
                    <button
                        key={manager}
                        onClick={() => setActiveManager(manager)}
                        type="button"
                        className={`flex-1 py-3 font-semibold text-sm capitalize transition-colors duration-200 ${
                            activeManager === manager
                                ? "border-indigo-500 border-b-2 bg-gray-900 text-indigo-400"
                                : "text-gray-400 hover:bg-gray-750 hover:text-gray-200"
                        }`}
                    >
                        {manager}
                    </button>
                ))}
            </div>

            {/* Code Box */}
            <div className="relative flex items-center justify-between bg-gray-950 p-4">
                <pre className="overflow-x-auto pr-12 font-mono text-indigo-300 text-sm">
                    <code>{commands[activeManager]}</code>
                </pre>

                {/* Copy Button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-4 rounded-md bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <svg
                            className="h-5 w-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 8"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m0 4H10m0 0l3-3m-3 3l3 3"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};
