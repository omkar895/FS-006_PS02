import { NextResponse } from "next/server";

export interface ApiSuccessMeta {
  requestId: string;
  generatedAt: string;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      data,
      meta: {
        requestId: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
      },
    },
    { status }
  );
}

export interface ApiFieldError {
  [field: string]: string[];
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: ApiFieldError
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
      meta: {
        requestId: crypto.randomUUID(),
      },
    },
    { status }
  );
}

