export function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  return (
    anyErr?.error?.message ??
    anyErr?.error ??
    anyErr?.message ??
    fallback
  );
}

