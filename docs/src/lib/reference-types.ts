export type ReferenceShapeField = {
  allowedValues?: string[];
  defaultValue?: string;
  description: string;
  name: string;
  required?: boolean;
  type: string;
  children?: ReferenceShapeField[];
};

export type ReferenceShape = {
  description: string;
  fields: ReferenceShapeField[];
  typeName: string;
};

const latLngFields: ReferenceShapeField[] = [
  {
    name: "lat",
    type: "number",
    required: true,
    description: "Latitude in decimal degrees.",
  },
  {
    name: "lng",
    type: "number",
    required: true,
    description: "Longitude in decimal degrees.",
  },
];

const timestampedLatLngFields: ReferenceShapeField[] = [
  ...latLngFields,
  {
    name: "ts",
    type: "ISODateString",
    description: "Telemetry timestamp when supplied by Linxio.",
  },
];

const listParamsFields: ReferenceShapeField[] = [
  {
    name: "fields",
    type: "FieldSelector<TField>",
    description: "Field projection sent as repeated fields[] query parameters.",
  },
  {
    name: "limit",
    type: "number",
    description: "Maximum records to request per page.",
  },
  {
    name: "page",
    type: "number",
    description: "Page number to request.",
    defaultValue: "1",
  },
  {
    name: "sort",
    type: "string",
    description: "Sort expression accepted by Linxio for that endpoint.",
  },
  {
    name: "[filter]",
    type: "QueryValue",
    description:
      "Additional endpoint-specific filters forwarded as query parameters.",
  },
];

const responseErrorField: ReferenceShapeField = {
  name: "error",
  type: "LinxioError | null",
  description: "Typed SDK error when the operation fails.",
};

const metadataRecordFields: ReferenceShapeField[] = [
  {
    name: "id",
    type: "LinxioId",
    description: "Stable identifier when the endpoint returns one.",
  },
  {
    name: "code",
    type: "string",
    description: "Machine-readable code, slug, or setting key.",
  },
  {
    name: "label",
    type: "string",
    description: "Human-readable label.",
  },
  {
    name: "name",
    type: "string",
    description: "Human-readable name.",
  },
  {
    name: "order",
    type: "number",
    description: "Sort order used by dashboard dropdowns.",
  },
  {
    name: "value",
    type: "string",
    description: "Machine-readable value used by dashboard dropdowns.",
  },
];

export const referenceShapes = {
  DateRangeParams: {
    typeName: "DateRangeParams",
    description:
      "Date-range parameters used by report, route, and sensor endpoints.",
    fields: [
      {
        name: "dateFrom",
        type: "ISODateString",
        description:
          "Start date/time accepted by Linxio endpoints that use dateFrom.",
      },
      {
        name: "dateTo",
        type: "ISODateString",
        description:
          "End date/time accepted by Linxio endpoints that use dateTo.",
      },
      {
        name: "startDate",
        type: "ISODateString",
        description:
          "Start date/time accepted by endpoints that use startDate.",
      },
      {
        name: "endDate",
        type: "ISODateString",
        description: "End date/time accepted by endpoints that use endDate.",
      },
    ],
  },
  LatLng: {
    typeName: "LatLng",
    description: "Latitude/longitude coordinate pair.",
    fields: latLngFields,
  },
  LinxioApiError: {
    typeName: "LinxioApiError",
    description: "Error thrown when Linxio returns a non-2xx HTTP response.",
    fields: [
      {
        name: "message",
        type: "string",
        required: true,
        description: "Safe error message derived from the API response.",
      },
      {
        name: "status",
        type: "number",
        required: true,
        description: "HTTP status code returned by Linxio.",
      },
      {
        name: "statusText",
        type: "string",
        description: "HTTP status text returned by Linxio when available.",
      },
      {
        name: "body",
        type: "unknown",
        description: "Parsed error response body.",
      },
      {
        name: "method",
        type: "string",
        description: "HTTP method associated with the failed request.",
      },
      {
        name: "path",
        type: "string",
        description: "API path associated with the failed request.",
      },
      {
        name: "requestId",
        type: "string",
        description:
          "Request identifier from X-Request-Id when Linxio supplies one.",
      },
    ],
  },
  LinxioAreaGroup: {
    typeName: "LinxioAreaGroup",
    description: "Dashboard area-group record.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Area-group identifier.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Area-group display name.",
      },
    ],
  },
  LinxioAreaGroupPayload: {
    typeName: "LinxioAreaGroupPayload",
    description: "Payload accepted by dashboard-derived area-group endpoints.",
    fields: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Area-group display name.",
      },
    ],
  },
  LinxioClientAccount: {
    typeName: "LinxioClientAccount",
    description: "Client account record.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Client account identifier.",
      },
      {
        name: "name",
        type: "string | null",
        description: "Client account display name.",
      },
      {
        name: "timezone",
        type: "LinxioId | null",
        description: "Timezone identifier when supplied.",
      },
    ],
  },
  LinxioClientUserListParams: {
    typeName: "LinxioClientUserListParams",
    description: "Parameters for client user list endpoints.",
    fields: [
      ...listParamsFields,
      {
        name: "role",
        type: "string",
        description: "Optional role filter.",
      },
    ],
  },
  LinxioCount: {
    typeName: "LinxioCount",
    description:
      "Count response returned by dashboard-derived count endpoints.",
    fields: [
      {
        name: "count",
        type: "number",
        description: "Count value when Linxio returns count.",
      },
      {
        name: "total",
        type: "number",
        description: "Count value when Linxio returns total.",
      },
    ],
  },
  LinxioCurrentPlan: {
    typeName: "LinxioCurrentPlan",
    description: "Current-plan permission summary returned by Linxio.",
    fields: [
      {
        name: "features",
        type: "string[]",
        description: "Enabled feature keys when Linxio returns a feature list.",
      },
      {
        name: "planId",
        type: "LinxioId",
        description: "Plan identifier when supplied.",
      },
      {
        name: "permissions",
        type: "LinxioRecord",
        description: "Permission flags keyed by feature or module name.",
      },
    ],
  },
  LinxioCurrentUser: {
    typeName: "LinxioCurrentUser",
    description:
      "Current-user object returned by /me; fields vary by role and requested selectors.",
    fields: [
      {
        name: "dateFormat",
        type: "string",
        description: "User date format when supplied.",
      },
      {
        name: "email",
        type: "string",
        description: "Current user email address.",
      },
      {
        name: "fullName",
        type: "string",
        description: "Current user display name.",
      },
      {
        name: "id",
        type: "LinxioId",
        description: "Current user identifier.",
      },
      {
        name: "permissions",
        type: "string[]",
        description: "Permission keys when supplied.",
      },
      {
        name: "team",
        type: "JsonObject",
        description: "Current team details.",
        children: [
          {
            name: "clientId",
            type: "LinxioId",
            description:
              "Client account identifier when the user belongs to a client team.",
          },
          {
            name: "id",
            type: "LinxioId",
            description: "Team identifier.",
          },
          {
            name: "name",
            type: "string",
            description: "Team display name.",
          },
          {
            name: "resellerId",
            type: "LinxioId",
            description:
              "Reseller identifier when the user belongs to a reseller team.",
          },
        ],
      },
      {
        name: "teamType",
        type: "LinxioTeamType",
        description: "Current team type.",
      },
    ],
  },
  LinxioDevice: {
    typeName: "LinxioDevice",
    description: "Device record returned by Linxio device endpoints.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Device identifier.",
      },
      {
        name: "imei",
        type: "string | null",
        description: "Device IMEI when supplied.",
      },
      {
        name: "lastCoordinates",
        type: "LatLng & { ts?: ISODateString } | null",
        description: "Last known device coordinates.",
        children: timestampedLatLngFields,
      },
      {
        name: "serial",
        type: "string | null",
        description: "Device serial number.",
      },
      {
        name: "status",
        type: "string | null",
        description: "Device status.",
      },
      {
        name: "usage",
        type: "string | null",
        description: "Usage label when supplied.",
      },
      {
        name: "vehicleId",
        type: "LinxioId | null",
        description: "Assigned vehicle identifier.",
      },
      {
        name: "vendor",
        type: "string | null",
        description: "Device vendor label.",
      },
    ],
  },
  LinxioDeviceCamera: {
    typeName: "LinxioDeviceCamera",
    description: "Camera record associated with a device.",
    fields: [
      {
        name: "deviceId",
        type: "LinxioId",
        description: "Device identifier.",
      },
      {
        name: "id",
        type: "LinxioId",
        description: "Camera identifier.",
      },
      {
        name: "name",
        type: "string",
        description: "Camera display name.",
      },
      {
        name: "status",
        type: "string",
        description: "Camera status.",
      },
    ],
  },
  LinxioDeviceCoordinate: {
    typeName: "LinxioDeviceCoordinate",
    description: "Coordinate reported by a device.",
    fields: [
      ...timestampedLatLngFields,
      {
        name: "deviceId",
        type: "LinxioId",
        description: "Device identifier.",
      },
      {
        name: "id",
        type: "LinxioId",
        description: "Coordinate record identifier.",
      },
    ],
  },
  LinxioDeviceInstallation: {
    typeName: "LinxioDeviceInstallation",
    description:
      "Device installation row from the dashboard-derived installation endpoint.",
    fields: [
      {
        name: "deviceId",
        type: "LinxioId",
        description: "Device identifier.",
      },
      {
        name: "id",
        type: "LinxioId",
        description: "Installation record identifier.",
      },
      {
        name: "installedAt",
        type: "ISODateString | null",
        description: "Install timestamp.",
      },
      {
        name: "uninstalledAt",
        type: "ISODateString | null",
        description: "Uninstall timestamp when supplied.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioDeviceInstallationPayload: {
    typeName: "LinxioDeviceInstallationPayload",
    description: "Payload for installing a device into a vehicle.",
    fields: [
      {
        name: "installedAt",
        type: "ISODateString",
        description: "Install timestamp.",
      },
      {
        name: "odometer",
        type: "number",
        description: "Vehicle odometer at install time.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioDevicePayload: {
    typeName: "LinxioDevicePayload",
    description: "Payload for creating or updating a device.",
    fields: [
      {
        name: "imei",
        type: "string",
        description: "Device IMEI.",
      },
      {
        name: "serial",
        type: "string",
        description: "Device serial number.",
      },
      {
        name: "typeId",
        type: "LinxioId",
        description: "Device type identifier.",
      },
      {
        name: "usage",
        type: "string",
        description: "Usage label.",
      },
      {
        name: "vendorId",
        type: "LinxioId",
        description: "Vendor identifier.",
      },
    ],
  },
  LinxioDeviceUninstallPayload: {
    typeName: "LinxioDeviceUninstallPayload",
    description: "Payload for uninstalling a device from a vehicle.",
    fields: [
      {
        name: "odometer",
        type: "number",
        description: "Vehicle odometer at uninstall time.",
      },
      {
        name: "uninstalledAt",
        type: "ISODateString",
        description: "Uninstall timestamp.",
      },
    ],
  },
  LinxioDeviceVendor: {
    typeName: "LinxioDeviceVendor",
    description:
      "Device vendor record from the dashboard-derived vendor endpoint.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        description: "Vendor identifier.",
      },
      {
        name: "name",
        type: "string",
        description: "Vendor display name.",
      },
    ],
  },
  LinxioDigitalForm: {
    typeName: "LinxioDigitalForm",
    description: "Digital form record.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Digital form identifier.",
      },
      {
        name: "name",
        type: "string",
        description: "Digital form display name.",
      },
      {
        name: "status",
        type: "string",
        description: "Digital form status.",
      },
    ],
  },
  LinxioEngineHours: {
    typeName: "LinxioEngineHours",
    description: "Current engine-hours reading for a vehicle.",
    fields: [
      {
        name: "engineHours",
        type: "number",
        required: true,
        description: "Current engine-hours reading.",
      },
      {
        name: "occurredAt",
        type: "ISODateString | null",
        description: "Timestamp associated with the reading when supplied.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioError: {
    typeName: "LinxioError",
    description: "Base class for all SDK-defined errors.",
    fields: [
      {
        name: "message",
        type: "string",
        required: true,
        description: "Safe error message.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "SDK error class name.",
      },
      {
        name: "cause",
        type: "unknown",
        description: "Original cause when available.",
      },
      {
        name: "method",
        type: "string",
        description: "HTTP method when the error came from a request.",
      },
      {
        name: "path",
        type: "string",
        description: "API path when the error came from a request.",
      },
      {
        name: "requestId",
        type: "string",
        description: "Request identifier from X-Request-Id when supplied.",
      },
    ],
  },
  LinxioFuelCard: {
    typeName: "LinxioFuelCard",
    description: "Fuel card record.",
    fields: [
      {
        name: "cardNumber",
        type: "string",
        description: "Fuel card number.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Fuel card identifier.",
      },
      {
        name: "vehicleId",
        type: "LinxioId | null",
        description: "Assigned vehicle identifier.",
      },
    ],
  },
  LinxioFuelRecord: {
    typeName: "LinxioFuelRecord",
    description: "Fuel transaction record.",
    fields: [
      {
        name: "driver",
        type: "string | null",
        description: "Driver display name.",
      },
      {
        name: "fuelCardNumber",
        type: "string | null",
        description: "Fuel card number.",
      },
      {
        name: "fuelPrice",
        type: "number | null",
        description: "Fuel price.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Fuel transaction identifier.",
      },
      {
        name: "petrolStation",
        type: "string | null",
        description: "Petrol station display name.",
      },
      {
        name: "refueled",
        type: "number | null",
        description: "Fuel volume.",
      },
      {
        name: "total",
        type: "number | null",
        description: "Total transaction amount.",
      },
      {
        name: "transactionDate",
        type: "ISODateString",
        description: "Transaction timestamp.",
      },
      {
        name: "vehicle",
        type: "LinxioRecord | null",
        description: "Vehicle payload when included by Linxio.",
      },
    ],
  },
  LinxioFuelListParams: {
    typeName: "LinxioFuelListParams",
    description: "Parameters for fuel list and summary endpoints.",
    fields: listParamsFields,
  },
  LinxioFuelSummaryRecord: {
    typeName: "LinxioFuelSummaryRecord",
    description: "Fuel summary row.",
    fields: [
      {
        name: "depot",
        type: "string | null",
        description: "Depot label.",
      },
      {
        name: "groups",
        type: "string | null",
        description: "Vehicle groups label.",
      },
      {
        name: "mileage",
        type: "number | null",
        description: "Mileage in the summary period.",
      },
      {
        name: "refueled",
        type: "number | null",
        description: "Fuel volume in the summary period.",
      },
      {
        name: "regNo",
        type: "string | null",
        description: "Vehicle registration number.",
      },
      {
        name: "total",
        type: "number | null",
        description: "Total fuel cost in the summary period.",
      },
    ],
  },
  LinxioGeofence: {
    typeName: "LinxioGeofence",
    description: "Geofence object. Linxio's API calls these areas.",
    fields: [
      {
        name: "color",
        type: "string | null",
        description: "Display color.",
      },
      {
        name: "coordinates",
        type: "LatLng[]",
        description: "Polygon/polyline/rectangle coordinates.",
        children: latLngFields,
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Geofence identifier.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Geofence display name.",
      },
      {
        name: "radius",
        type: "number | null",
        description: "Circle radius when the geofence is circular.",
      },
      {
        name: "type",
        type: "GeofenceType",
        description: "Geofence shape type.",
      },
    ],
  },
  LinxioGeofencePayload: {
    typeName: "LinxioGeofencePayload",
    description: "Payload for creating or updating a geofence.",
    fields: [
      {
        name: "color",
        type: "string",
        description: "Display color.",
      },
      {
        name: "coordinates",
        type: "LatLng[]",
        description: "Polygon/polyline/rectangle coordinates.",
        children: latLngFields,
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Geofence display name.",
      },
      {
        name: "radius",
        type: "number",
        description: "Circle radius.",
      },
      {
        name: "type",
        type: "GeofenceType",
        required: true,
        description: "Geofence shape type.",
      },
    ],
  },
  LinxioHttpRequestOptions: {
    typeName: "LinxioHttpRequestOptions",
    description: "Per-request options accepted by the low-level HTTP client.",
    fields: [
      {
        name: "body",
        type: "unknown",
        description:
          "Request body for mutation methods. Plain objects are JSON encoded.",
      },
      {
        name: "headers",
        type: "HeadersInit",
        description: "Additional request headers.",
      },
      {
        name: "idempotencyKey",
        type: "string",
        description:
          "Optional idempotency key for caller-managed retry safety.",
      },
      {
        name: "params",
        type: "QueryParams",
        description: "Query parameters appended to the URL.",
      },
      {
        name: "responseType",
        type: "json | text | blob | arrayBuffer | raw",
        description: "Response parser override.",
        defaultValue: "json",
      },
      {
        name: "signal",
        type: "AbortSignal",
        description: "Abort signal for caller-managed cancellation.",
      },
      {
        name: "skipAuth",
        type: "boolean",
        description: "Skip the bearer token for this request.",
      },
      {
        name: "skipAuthRefresh",
        type: "boolean",
        description: "Skip automatic refresh handling for this request.",
      },
      {
        name: "timeoutMs",
        type: "number",
        description: "Override the client timeout for this request.",
      },
    ],
  },
  LinxioLoginRequest: {
    typeName: "LinxioLoginRequest",
    description: "Credentials for client.auth.login().",
    fields: [
      {
        name: "domain",
        type: "string",
        description:
          "Optional tenant-domain hint accepted by some login flows.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description: "Email address for the Linxio user.",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description: "Password for the Linxio user.",
      },
    ],
  },
  LinxioLoginResponse: {
    typeName: "LinxioLoginResponse",
    description: "Response returned by the documented /login endpoint.",
    fields: [
      {
        name: "expireAt",
        type: "ISODateString",
        description: "Token expiry timestamp when supplied.",
      },
      {
        name: "loginWithId",
        type: "boolean",
        description: "Whether the login flow was resolved by identifier.",
      },
      {
        name: "otp_required",
        type: "boolean",
        description:
          "Whether OTP verification is required before the session is usable.",
      },
      {
        name: "refreshToken",
        type: "string",
        description: "Refresh token used to renew the session.",
      },
      {
        name: "roleId",
        type: "LinxioId",
        description: "Role identifier when supplied.",
      },
      {
        name: "teamType",
        type: "LinxioTeamType",
        description: "Team type returned by Linxio.",
      },
      {
        name: "token",
        type: "string",
        required: true,
        description: "JWT bearer token for authenticated requests.",
      },
    ],
  },
  LinxioMetadataRecord: {
    typeName: "LinxioMetadataRecord",
    description: "Shared shape for dashboard reference-data records.",
    fields: metadataRecordFields,
  },
  LinxioOdometer: {
    typeName: "LinxioOdometer",
    description: "Vehicle odometer reading returned by Linxio.",
    fields: [
      {
        name: "accuracy",
        type: "number | null",
        description: "Reading accuracy when supplied.",
      },
      {
        name: "deviceId",
        type: "LinxioId | null",
        description: "Device identifier.",
      },
      {
        name: "driverId",
        type: "LinxioId | null",
        description: "Driver identifier.",
      },
      {
        name: "id",
        type: "LinxioId | null",
        description: "Odometer reading identifier.",
      },
      {
        name: "isSyncedWithDevice",
        type: "boolean",
        description: "Whether the reading is synced with the device.",
      },
      {
        name: "lastTrackerRecordOccurredAt",
        type: "ISODateString | null",
        description: "Timestamp of the last tracker record.",
      },
      {
        name: "lastTrackerRecordOdometer",
        type: "number | null",
        description: "Odometer value from the last tracker record.",
      },
      {
        name: "occurredAt",
        type: "ISODateString | null",
        description: "Timestamp associated with the reading.",
      },
      {
        name: "odometer",
        type: "number",
        required: true,
        description: "Odometer reading.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioOdometerParams: {
    typeName: "LinxioOdometerParams",
    description: "Optional parameters for fetching odometer values.",
    fields: [
      {
        name: "occurredAt",
        type: "ISODateString",
        description: "Optional occurrence timestamp.",
      },
    ],
  },
  LinxioOdometerRecalibration: {
    typeName: "LinxioOdometerRecalibration",
    description: "Payload for recalibrating a vehicle odometer.",
    fields: [
      {
        name: "occurredAt",
        type: "ISODateString",
        required: true,
        description: "When the recalibrated reading applies.",
      },
      {
        name: "odometer",
        type: "number",
        required: true,
        description: "New odometer value.",
      },
    ],
  },
  LinxioPageResult: {
    typeName: "LinxioPageResult",
    description: "Paginated result returned by SDK list and report methods.",
    fields: [
      {
        name: "data",
        type: "TData[] | null",
        description:
          "Records for the current page on success, or null on failure.",
      },
      responseErrorField,
      {
        name: "meta",
        type: "LinxioPaginationMeta | null",
        description: "Normalized pagination metadata on success.",
      },
      {
        name: "page",
        type: "number | null",
        description: "Current page number on success.",
      },
      {
        name: "limit",
        type: "number | null",
        description: "Page size on success.",
      },
      {
        name: "total",
        type: "number | null",
        description: "Total matching record count on success.",
      },
      {
        name: "aggregations",
        type: "unknown",
        description: "Aggregation payload when Linxio returns one.",
      },
      {
        name: "additionalFields",
        type: "Record<string, unknown>",
        description: "Additional page envelope fields retained by the SDK.",
      },
    ],
  },
  LinxioPaginationMeta: {
    typeName: "LinxioPaginationMeta",
    description: "Normalized pagination metadata returned by SDK list methods.",
    fields: [
      {
        name: "limit",
        type: "number",
        required: true,
        description: "Page size.",
      },
      {
        name: "page",
        type: "number",
        required: true,
        description: "Current page number.",
      },
      {
        name: "total",
        type: "number",
        required: true,
        description: "Total matching record count.",
      },
    ],
  },
  LinxioRefreshTokenResponse: {
    typeName: "LinxioRefreshTokenResponse",
    description: "Response returned by /token/refresh.",
    fields: [
      {
        name: "expireAt",
        type: "ISODateString",
        description: "Token expiry timestamp when supplied.",
      },
      {
        name: "refreshToken",
        type: "string",
        description: "New refresh token when Linxio rotates it.",
      },
      {
        name: "token",
        type: "string",
        required: true,
        description: "New JWT bearer token.",
      },
    ],
  },
  LinxioReportParams: {
    typeName: "LinxioReportParams",
    description: "Common parameters for report endpoints.",
    fields: [
      ...listParamsFields,
      {
        name: "format",
        type: "LinxioFileFormat",
        description: "Export/report file format.",
      },
      {
        name: "dateFrom / dateTo",
        type: "ISODateString",
        description: "Date range for endpoints that use dateFrom/dateTo.",
      },
      {
        name: "startDate / endDate",
        type: "ISODateString",
        description: "Date range for endpoints that use startDate/endDate.",
      },
    ],
  },
  LinxioReseller: {
    typeName: "LinxioReseller",
    description: "Reseller account record.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Reseller identifier.",
      },
      {
        name: "name",
        type: "string | null",
        description: "Reseller display name.",
      },
    ],
  },
  LinxioResult: {
    typeName: "LinxioResult",
    description: "Standard result returned by SDK service methods.",
    fields: [
      {
        name: "data",
        type: "TData | null",
        description: "Returned data on success, or null on failure.",
      },
      responseErrorField,
    ],
  },
  LinxioRouteCoordinate: {
    typeName: "LinxioRouteCoordinate",
    description: "One route coordinate point.",
    fields: [
      ...timestampedLatLngFields,
      {
        name: "id",
        type: "LinxioId",
        description: "Coordinate identifier.",
      },
      {
        name: "nullable",
        type: "boolean",
        description: "Whether the coordinate can be null in source data.",
      },
    ],
  },
  LinxioRoutePoint: {
    typeName: "LinxioRoutePoint",
    description: "Start or finish point for a route segment.",
    fields: [
      {
        name: "address",
        type: "string | null",
        description: "Resolved address.",
      },
      {
        name: "lastCoordinates",
        type: "LatLng & { ts?: ISODateString } | null",
        description: "Last known coordinates for the route point.",
        children: timestampedLatLngFields,
      },
    ],
  },
  LinxioScheduledReport: {
    typeName: "LinxioScheduledReport",
    description: "Scheduled report record.",
    fields: [
      {
        name: "format",
        type: "LinxioFileFormat",
        description: "Report output format.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Scheduled report identifier.",
      },
      {
        name: "name",
        type: "string",
        description: "Scheduled report display name.",
      },
      {
        name: "status",
        type: "active | disabled | string",
        description: "Scheduled report status.",
      },
      {
        name: "type",
        type: "string",
        description: "Scheduled report type.",
      },
    ],
  },
  LinxioScheduledReportPayload: {
    typeName: "LinxioScheduledReportPayload",
    description: "Payload for creating a scheduled report.",
    fields: [
      {
        name: "format",
        type: "LinxioFileFormat",
        required: true,
        description: "Report output format.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Scheduled report display name.",
      },
      {
        name: "params",
        type: "Record<string, unknown>",
        description: "Report-specific parameter object.",
      },
      {
        name: "type",
        type: "string",
        required: true,
        description: "Scheduled report type.",
      },
    ],
  },
  LinxioSensor: {
    typeName: "LinxioSensor",
    description: "Sensor record returned by Linxio sensor endpoints.",
    fields: [
      {
        name: "deviceId",
        type: "LinxioId | null",
        description: "Device identifier.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Sensor identifier.",
      },
      {
        name: "name",
        type: "string | null",
        description: "Sensor display name.",
      },
      {
        name: "type",
        type: "string | null",
        description: "Sensor type.",
      },
      {
        name: "vehicleId",
        type: "LinxioId | null",
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioSensorReportParams: {
    typeName: "LinxioSensorReportParams",
    description: "Parameters for temperature/humidity sensor reports.",
    fields: [
      ...listParamsFields,
      {
        name: "sensorId",
        type: "LinxioId",
        description: "Sensor identifier filter.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        description: "Vehicle identifier filter.",
      },
      {
        name: "dateFrom / dateTo",
        type: "ISODateString",
        description: "Date range for the sensor report.",
      },
    ],
  },
  LinxioSession: {
    typeName: "LinxioSession",
    description: "In-memory token state used by LinxioClient.",
    fields: [
      {
        name: "expireAt",
        type: "ISODateString",
        description: "Token expiry timestamp.",
      },
      {
        name: "refreshToken",
        type: "string",
        description: "Refresh token.",
      },
      {
        name: "token",
        type: "string",
        description: "JWT bearer token.",
      },
    ],
  },
  LinxioTemperatureHumidityReading: {
    typeName: "LinxioTemperatureHumidityReading",
    description: "Temperature/humidity reading returned by sensor reports.",
    fields: [
      {
        name: "humidity",
        type: "number | null",
        description: "Humidity reading.",
      },
      {
        name: "occurredAt",
        type: "ISODateString",
        description: "Reading timestamp.",
      },
      {
        name: "sensorId",
        type: "LinxioId",
        description: "Sensor identifier.",
      },
      {
        name: "temperature",
        type: "number | null",
        description: "Temperature reading.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioTrackingPosition: {
    typeName: "LinxioTrackingPosition",
    description:
      "Live vehicle position payload received from the coordinates socket.",
    fields: [
      ...timestampedLatLngFields,
      {
        name: "address",
        type: "string | null",
        description: "Resolved address.",
      },
      {
        name: "deviceId",
        type: "LinxioId",
        description: "Device identifier.",
      },
      {
        name: "driverId",
        type: "LinxioId | null",
        description: "Driver identifier.",
      },
      {
        name: "heading",
        type: "number | null",
        description: "Heading in degrees.",
      },
      {
        name: "speed",
        type: "number | null",
        description: "Speed value from Linxio telemetry.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioUser: {
    typeName: "LinxioUser",
    description: "User record returned by Linxio user endpoints.",
    fields: [
      {
        name: "email",
        type: "string | null",
        description: "User email address.",
      },
      {
        name: "fullName",
        type: "string | null",
        description: "User display name.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "User identifier.",
      },
      {
        name: "role",
        type: "string | null",
        description: "Role label.",
      },
      {
        name: "status",
        type: "string | null",
        description: "User status.",
      },
    ],
  },
  LinxioUserPayload: {
    typeName: "LinxioUserPayload",
    description: "Payload for creating or updating a user.",
    fields: [
      {
        name: "email",
        type: "string",
        description: "User email address.",
      },
      {
        name: "firstName",
        type: "string",
        description: "Given name.",
      },
      {
        name: "fullName",
        type: "string",
        description: "Full display name.",
      },
      {
        name: "lastName",
        type: "string",
        description: "Family name.",
      },
      {
        name: "phone",
        type: "string",
        description: "Phone number.",
      },
      {
        name: "roleId",
        type: "LinxioId",
        description: "Role identifier.",
      },
    ],
  },
  LinxioUserListParams: {
    typeName: "LinxioUserListParams",
    description: "Parameters for client.users.list().",
    fields: [
      ...listParamsFields,
      {
        name: "role",
        type: "string",
        description: "Optional role filter.",
      },
    ],
  },
  LinxioVehicle: {
    typeName: "LinxioVehicle",
    description: "Vehicle record returned by Linxio vehicle endpoints.",
    fields: [
      {
        name: "defaultLabel",
        type: "string | null",
        description: "Default display label.",
      },
      {
        name: "depotName",
        type: "string | null",
        description: "Depot display name.",
      },
      {
        name: "driver",
        type: "string | null",
        description: "Driver display name.",
      },
      {
        name: "driverId",
        type: "LinxioId | null",
        description: "Assigned driver identifier.",
      },
      {
        name: "groupsList",
        type: "string | null",
        description: "Comma-separated group display labels when supplied.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
      {
        name: "lastCoordinates",
        type: "LatLng & { ts?: ISODateString } | null",
        description: "Last known vehicle coordinates.",
        children: timestampedLatLngFields,
      },
      {
        name: "lastLoggedAt",
        type: "ISODateString | null",
        description: "Last telemetry timestamp.",
      },
      {
        name: "model",
        type: "string | null",
        description: "Vehicle model text.",
      },
      {
        name: "regNo",
        type: "string | null",
        description: "Registration number or fleet identifier.",
      },
      {
        name: "status",
        type: "string | null",
        description: "Vehicle status.",
      },
      {
        name: "todayData",
        type: "{ avgSpeed?: number; distance?: number; duration?: number } | null",
        description: "Current-day telemetry summary when selected.",
        children: [
          {
            name: "avgSpeed",
            type: "number",
            description: "Average speed for the current-day summary.",
          },
          {
            name: "distance",
            type: "number",
            description: "Distance for the current-day summary.",
          },
          {
            name: "duration",
            type: "number",
            description: "Duration for the current-day summary.",
          },
        ],
      },
    ],
  },
  LinxioVehicleListParams: {
    typeName: "LinxioVehicleListParams",
    description: "Parameters for client.vehicles.list().",
    fields: listParamsFields,
  },
  LinxioVehiclePayload: {
    typeName: "LinxioVehiclePayload",
    description: "Payload for creating or updating a vehicle.",
    fields: [
      {
        name: "defaultLabel",
        type: "string",
        description: "Default display label.",
      },
      {
        name: "depotId",
        type: "LinxioId | null",
        description: "Depot identifier when the tenant uses depots.",
      },
      {
        name: "groupIds",
        type: "LinxioId[]",
        description: "Vehicle group identifiers.",
      },
      {
        name: "model",
        type: "string",
        description: "Vehicle model text.",
      },
      {
        name: "regNo",
        type: "string",
        description: "Registration number or fleet identifier.",
      },
      {
        name: "typeId",
        type: "LinxioId",
        description: "Vehicle type identifier.",
      },
      {
        name: "vin",
        type: "string",
        description: "Vehicle identification number.",
      },
    ],
  },
  LinxioVehicleRoute: {
    typeName: "LinxioVehicleRoute",
    description: "One route segment returned by Linxio.",
    fields: [
      {
        name: "address",
        type: "string | null",
        description: "Resolved address for the segment.",
      },
      {
        name: "avgSpeed",
        type: "number | null",
        description: "Average speed.",
      },
      {
        name: "comment",
        type: "string | null",
        description: "Route comment when supplied.",
      },
      {
        name: "coordinates",
        type: "LinxioRouteCoordinate[]",
        description: "Route coordinate points. This field can be large.",
        children: referencePlaceholder("LinxioRouteCoordinate"),
      },
      {
        name: "deviceId",
        type: "LinxioId | null",
        description: "Device identifier.",
      },
      {
        name: "distance",
        type: "number | string | null",
        description: "Route distance.",
      },
      {
        name: "driverId",
        type: "LinxioId | null",
        description: "Driver identifier.",
      },
      {
        name: "duration",
        type: "number | null",
        description: "Route duration.",
      },
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Route segment identifier.",
      },
      {
        name: "maxSpeed",
        type: "number | null",
        description: "Maximum speed.",
      },
      {
        name: "pointFinish",
        type: "LinxioRoutePoint | null",
        description: "Finish point for the segment.",
        children: referencePlaceholder("LinxioRoutePoint"),
      },
      {
        name: "pointStart",
        type: "LinxioRoutePoint | null",
        description: "Start point for the segment.",
        children: referencePlaceholder("LinxioRoutePoint"),
      },
      {
        name: "scope",
        type: "unknown",
        description: "Route scope payload when supplied by Linxio.",
      },
      {
        name: "type",
        type: "driving | idle | stopped | string",
        description: "Route segment type.",
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioVehicleRoutesGroup: {
    typeName: "LinxioVehicleRoutesGroup",
    description: "Route response group for a vehicle/driver pair.",
    fields: [
      {
        name: "driverId",
        type: "LinxioId | null",
        description: "Driver identifier.",
      },
      {
        name: "routes",
        type: "LinxioVehicleRoute[]",
        required: true,
        description: "Route segments for the group.",
        children: referencePlaceholder("LinxioVehicleRoute"),
      },
      {
        name: "vehicleId",
        type: "LinxioId",
        required: true,
        description: "Vehicle identifier.",
      },
    ],
  },
  LinxioVehicleRoutesParams: {
    typeName: "LinxioVehicleRoutesParams",
    description: "Parameters for client.routes.getVehicleRoutes().",
    fields: [
      {
        name: "dateFrom",
        type: "ISODateString",
        description: "Start date/time.",
      },
      {
        name: "dateTo",
        type: "ISODateString",
        description: "End date/time.",
      },
      {
        name: "fields",
        type: "RouteField[]",
        description:
          "Additional route fields. coordinates can produce large responses.",
      },
      {
        name: "limit",
        type: "number",
        description: "Page size when supported.",
      },
      {
        name: "page",
        type: "number",
        description: "Page number when supported.",
      },
    ],
  },
  LinxioVehicleType: {
    typeName: "LinxioVehicleType",
    description:
      "Vehicle type record returned by the dashboard-derived vehicle types endpoint.",
    fields: [
      {
        name: "id",
        type: "LinxioId",
        required: true,
        description: "Vehicle type identifier.",
      },
      {
        name: "name",
        type: "string",
        description: "Vehicle type display name.",
      },
      {
        name: "order",
        type: "number",
        description: "Sort order when supplied.",
      },
    ],
  },
  LinxioVehicleTypeParams: {
    typeName: "LinxioVehicleTypeParams",
    description: "Parameters for client.vehicles.types().",
    fields: [
      {
        name: "limit",
        type: "number",
        description: "Maximum number of type records.",
        defaultValue: "1000",
      },
      {
        name: "sort",
        type: "string",
        description: "Sort expression.",
        defaultValue: "order",
      },
      {
        name: "[filter]",
        type: "QueryValue",
        description: "Additional filters forwarded as query parameters.",
      },
    ],
  },
} as const satisfies Record<string, ReferenceShape>;

export type ReferenceTypeName = keyof typeof referenceShapes;

export const referenceTypeNames = Object.keys(referenceShapes).sort();

export type ReferenceTypeToken = {
  href?: string;
  text: string;
};

export function getReferenceTypeHref(typeName: string): string | undefined {
  if (!isReferenceTypeName(typeName)) {
    return undefined;
  }

  return `/docs/sdk-reference/types#${slugify(typeName)}`;
}

export function getReferenceTypeNames(type: string): string[] {
  const names = type.match(/\b[A-Z][A-Za-z0-9]*/g) ?? [];
  return [...new Set(names.filter((name) => getReferenceTypeHref(name)))];
}

export function tokenizeReferenceType(type: string): ReferenceTypeToken[] {
  const tokens: ReferenceTypeToken[] = [];
  const matcher = /\b[A-Z][A-Za-z0-9]*/g;
  let lastIndex = 0;
  let match = matcher.exec(type);

  while (match) {
    const [text] = match;
    const href = getReferenceTypeHref(text);

    if (!href) {
      continue;
    }

    if (match.index > lastIndex) {
      tokens.push({ text: type.slice(lastIndex, match.index) });
    }

    tokens.push({ href, text });
    lastIndex = match.index + text.length;
    match = matcher.exec(type);
  }

  if (lastIndex < type.length) {
    tokens.push({ text: type.slice(lastIndex) });
  }

  return tokens.length ? tokens : [{ text: type }];
}

export function findReferenceShape(type: string): ReferenceShape | undefined {
  const typeName = getReferenceTypeNames(type).find(isReferenceTypeName);

  if (!typeName) {
    return undefined;
  }

  return resolveShape(typeName);
}

export function getReferenceShape(
  typeName: string,
): ReferenceShape | undefined {
  if (!isReferenceTypeName(typeName)) {
    return undefined;
  }

  return resolveShape(typeName);
}

export function buildReferenceExample(
  fields: readonly ReferenceShapeField[],
): Record<string, unknown> | undefined {
  const example: Record<string, unknown> = {};

  for (const field of groupDottedReferenceFields(fields)) {
    if (field.name === "throws") {
      continue;
    }

    const value = sampleValueForField(field);

    if (value === undefined) {
      continue;
    }

    setExampleValue(example, field.name, value);
  }

  return Object.keys(example).length ? example : undefined;
}

export function groupDottedReferenceFields(
  fields: readonly ReferenceShapeField[],
  parentDescription = "Object parameter. Expand to see child parameters.",
): ReferenceShapeField[] {
  const existingNames = new Set(fields.map((field) => field.name));
  const grouped = new Map<string, ReferenceShapeField>();
  const result: ReferenceShapeField[] = [];

  for (const field of fields) {
    const dotted = parseDottedFieldName(field.name);

    if (!dotted || existingNames.has(dotted.parent)) {
      result.push({
        ...field,
        children: field.children
          ? groupDottedReferenceFields(field.children, parentDescription)
          : undefined,
      });
      continue;
    }

    let parent = grouped.get(dotted.parent);
    if (!parent) {
      parent = {
        children: [],
        description: parentDescription,
        name: dotted.parent,
        type: "object",
      };
      grouped.set(dotted.parent, parent);
      result.push(parent);
    }

    parent.children?.push({
      ...field,
      children: field.children
        ? groupDottedReferenceFields(field.children, parentDescription)
        : undefined,
      name: dotted.child,
    });
  }

  return result;
}

function resolveShape(typeName: ReferenceTypeName): ReferenceShape {
  const shape = referenceShapes[typeName];

  return {
    ...shape,
    fields: resolveFields(shape.fields),
  };
}

function resolveFields(
  fields: readonly ReferenceShapeField[],
): ReferenceShapeField[] {
  return fields.map((field) => {
    if (!field.children) {
      return field;
    }

    const reference = getReferenceShapeReference(field.children);
    if (reference) {
      return {
        ...field,
        children: resolveShape(reference).fields,
      };
    }

    return {
      ...field,
      children: resolveFields(field.children),
    };
  });
}

function getReferenceShapeReference(
  fields: readonly ReferenceShapeField[],
): ReferenceTypeName | undefined {
  if (
    fields.length === 1 &&
    fields[0]?.name === "__reference" &&
    isReferenceTypeName(fields[0].type)
  ) {
    return fields[0].type;
  }

  return undefined;
}

function referencePlaceholder(typeName: string): ReferenceShapeField[] {
  return [
    {
      name: "__reference",
      type: typeName,
      description: "Reference placeholder resolved at render time.",
    },
  ];
}

function isReferenceTypeName(name: string): name is ReferenceTypeName {
  return Object.hasOwn(referenceShapes, name);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function setExampleValue(
  target: Record<string, unknown>,
  rawName: string,
  value: unknown,
) {
  for (const name of expandFieldName(rawName)) {
    const path = name.split(".").map((part) => part.trim());
    let cursor = target;

    for (const [index, segment] of path.entries()) {
      if (!segment || segment.startsWith("[") || segment === "none") {
        return;
      }

      if (index === path.length - 1) {
        cursor[segment] = value;
        continue;
      }

      const current = cursor[segment];
      if (!isPlainRecord(current)) {
        cursor[segment] = {};
      }

      cursor = cursor[segment] as Record<string, unknown>;
    }
  }
}

function expandFieldName(name: string): string[] {
  if (name.includes("/") && !name.includes(".")) {
    return name
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [name];
}

function sampleValueForField(field: ReferenceShapeField): unknown {
  if (field.name === "error") {
    return null;
  }

  return sampleValueForType(field.type, field);
}

function sampleValueForType(
  rawType: string,
  field?: ReferenceShapeField,
): unknown {
  const type = rawType.trim();

  if (!type || type === "void" || type === "undefined") {
    return undefined;
  }

  if (type.includes("LinxioError") && type.includes("null")) {
    return null;
  }

  const arrayElementType = getArrayElementType(type);
  if (arrayElementType) {
    const value = sampleValueForType(arrayElementType, field);
    return value === undefined ? [] : [value];
  }

  if (field?.children?.length) {
    return buildReferenceExample(field.children);
  }

  const shape = findReferenceShape(type);
  if (shape) {
    return buildReferenceExample(shape.fields);
  }

  if (type.includes("LinxioId")) {
    return 304;
  }

  if (type.includes("ISODateString")) {
    return "2026-06-08T12:00:00+08:00";
  }

  if (type.includes("boolean")) {
    return true;
  }

  if (type.includes("number")) {
    return sampleNumber(field?.name);
  }

  if (type.includes("string")) {
    return sampleString(field?.name);
  }

  if (type.includes("unknown") || type.includes("Record")) {
    return {};
  }

  if (type.includes("Blob")) {
    return "<binary>";
  }

  return sampleString(field?.name);
}

function getArrayElementType(type: string): string | undefined {
  const firstType = type
    .split("|")
    .map((part) => part.trim())
    .find((part) => part && part !== "null" && part !== "undefined");

  const match = firstType?.match(/^(readonly\s+)?(.+)\[\]$/);
  return match?.[2]?.trim();
}

function sampleNumber(name = ""): number {
  const normalized = name.toLowerCase();

  if (normalized.includes("avg")) {
    return 62;
  }

  if (normalized.includes("distance")) {
    return 12_750;
  }

  if (normalized.includes("duration")) {
    return 5_400;
  }

  if (normalized.includes("engine")) {
    return 1_234;
  }

  if (normalized.includes("limit")) {
    return 100;
  }

  if (normalized.includes("odometer")) {
    return 123_456;
  }

  if (normalized.includes("page")) {
    return 1;
  }

  if (normalized.includes("total") || normalized.includes("count")) {
    return 2;
  }

  if (normalized === "lat") {
    return -31.9523;
  }

  if (normalized === "lng") {
    return 115.8613;
  }

  return 123;
}

function sampleString(name = ""): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("email")) {
    return "user@example.com";
  }

  if (normalized.includes("expire") || normalized.includes("occurred")) {
    return "2026-06-08T12:00:00+08:00";
  }

  if (normalized.includes("format")) {
    return "json";
  }

  if (normalized.includes("fullname")) {
    return "Example User";
  }

  if (normalized.includes("label")) {
    return "Temporary SDK Test Vehicle";
  }

  if (normalized.includes("name")) {
    return "Example";
  }

  if (normalized.includes("refresh")) {
    return "refresh_token";
  }

  if (normalized.includes("regno")) {
    return "AMB-304";
  }

  if (normalized.includes("status")) {
    return "active";
  }

  if (normalized.includes("token")) {
    return "jwt_token";
  }

  return "string";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDottedFieldName(
  name: string,
): { child: string; parent: string } | undefined {
  const match = name.match(/^([A-Za-z][A-Za-z0-9_]*)\.(.+)$/);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  return {
    child: match[2],
    parent: match[1],
  };
}
