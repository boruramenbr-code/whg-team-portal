import { NextResponse } from 'next/server';

/**
 * Standardized API error response format.
 * All error responses include { error, code } for consistent client handling.
 */
export function apiError(
  message: string,
  status: number,
  code?: string,
  headers?: Record<string, string>
) {
  return NextResponse.json(
    {
      error: message,
      code: code || httpCodeToErrorCode(status),
    },
    { status, headers }
  );
}

function httpCodeToErrorCode(status: number): string {
  switch (status) {
    case 400: return 'bad_request';
    case 401: return 'unauthorized';
    case 403: return 'forbidden';
    case 404: return 'not_found';
    case 429: return 'rate_limited';
    case 500: return 'internal_error';
    case 503: return 'service_unavailable';
    default: return 'error';
  }
}
