import type {
    DateRangeParams,
    LinxioFileFormat,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Common parameters for report endpoints. */
export type LinxioReportParams = DateRangeParams &
    ListParams & {
        format?: LinxioFileFormat;
    };

/** Scheduled report record. */
export type LinxioScheduledReport = LinxioRecord & {
    format?: LinxioFileFormat;
    id: LinxioId;
    name?: string;
    status?: "active" | "disabled" | (string & {});
    type?: string;
};

/** Payload for creating a scheduled report. */
export type LinxioScheduledReportPayload = LinxioRecord & {
    format: LinxioFileFormat;
    name: string;
    params?: Record<string, unknown>;
    type: string;
};

/** Digital form record. */
export type LinxioDigitalForm = LinxioRecord & {
    id: LinxioId;
    name?: string;
    status?: string;
};
