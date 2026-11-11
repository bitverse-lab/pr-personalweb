const safeErrorNames = new Set([
  "Error",
  "AggregateError",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
]);

export type ErrorArea = "public-read" | "cv-download" | "storage-cleanup" | "contact-email" | "public-render" | "workspace-render";

export function safeErrorType(error: unknown): string {
  if (!(error instanceof Error) || !safeErrorNames.has(error.name)) return "UnknownError";
  return error.name;
}

export function reportError(area: ErrorArea, error: unknown): void {
  console.error(
    JSON.stringify({
      event: "application_error",
      area,
      errorType: safeErrorType(error),
    }),
  );
}
