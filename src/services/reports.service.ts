import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId, LinxioRecord } from "../types/common";
import type {
    LinxioDigitalForm,
    LinxioReportParams,
    LinxioScheduledReport,
    LinxioScheduledReportPayload,
} from "../types/reports";
import { BaseService } from "./base.service";

/** Scheduled report endpoints discovered from the dashboard bundle. */
export class ReportsService extends BaseService {
    /** List scheduled reports. */
    scheduled(
        params: LinxioReportParams = {},
    ): Promise<LinxioPageResult<LinxioScheduledReport>> {
        return this.getPage("/scheduled-report", params);
    }

    /** Fetch the scheduled-report template used by the Linxio dashboard. */
    scheduledTemplate(): Promise<LinxioResult<LinxioRecord>> {
        return this.result(() => this.http.get("/scheduled-report/template"));
    }

    /** Fetch one scheduled report. */
    getScheduled(
        reportId: LinxioId,
    ): Promise<LinxioResult<LinxioScheduledReport>> {
        return this.result(() =>
            this.http.get(`/scheduled-report/${reportId}`),
        );
    }

    /** Create a scheduled report. */
    createScheduled(
        payload: LinxioScheduledReportPayload,
    ): Promise<LinxioResult<LinxioScheduledReport>> {
        return this.result(() => this.http.post("/scheduled-report", payload));
    }

    /** Update a scheduled report. */
    updateScheduled(
        reportId: LinxioId,
        payload: Partial<LinxioScheduledReportPayload>,
    ): Promise<LinxioResult<LinxioScheduledReport>> {
        return this.result(() =>
            this.http.patch(`/scheduled-report/${reportId}`, payload),
        );
    }

    /** Delete a scheduled report. */
    deleteScheduled(reportId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.delete(`/scheduled-report/${reportId}`),
        );
    }
}

/** Digital form endpoints discovered from the dashboard bundle. */
export class DigitalFormsService extends BaseService {
    /** List digital forms. */
    list(): Promise<LinxioResult<LinxioDigitalForm[]>> {
        return this.result(() => this.http.get("/digital-form/form"));
    }

    /** Fetch one digital form. */
    get(formId: LinxioId): Promise<LinxioResult<LinxioDigitalForm>> {
        return this.result(() => this.http.get(`/digital-form/form/${formId}`));
    }

    /** Fetch one digital form answer. */
    answer(answerId: LinxioId): Promise<LinxioResult<LinxioRecord>> {
        return this.result(() =>
            this.http.get(`/digital-form/answer/${answerId}`),
        );
    }

    /** Download a digital form answer as a PDF Blob. */
    answerPdf(answerId: LinxioId): Promise<LinxioResult<Blob>> {
        return this.result(() =>
            this.http.get(`/digital-form/answer/${answerId}/pdf`, {
                responseType: "blob",
            }),
        );
    }
}
