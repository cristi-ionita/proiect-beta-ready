import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type RouteParams = {
  path?: string[];
};

type RouteContext = {
  params: Promise<RouteParams>;
};

const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "x-user-code",
  "accept-language",
  "accept",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
  "location",
] as const;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function getPathFromContext(context: RouteContext): Promise<string[]> {
  const resolved = await context.params;
  return Array.isArray(resolved?.path) ? resolved.path : [];
}

function buildTargetUrl(path: string[], request: NextRequest): string {
  const normalizedBaseUrl = normalizeBaseUrl(BACKEND_URL);
  const normalizedPath = path.map(encodeURIComponent).join("/");
  const target = new URL(`${normalizedBaseUrl}/${normalizedPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return target.toString();
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function buildRequestBody(
  request: NextRequest
): Promise<BodyInit | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength === "0") {
    return undefined;
  }

  return await request.arrayBuffer();
}

function buildResponseHeaders(backendResponse: Response): Headers {
  const headers = new Headers();

  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function forwardRequest(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const path = await getPathFromContext(context);
  const url = buildTargetUrl(path, request);
  const headers = buildForwardHeaders(request);
  const body = await buildRequestBody(request);

  try {
    const backendResponse = await fetch(url, {
      method: request.method,
      headers,
      cache: "no-store",
      body,
      redirect: "manual",
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: buildResponseHeaders(backendResponse),
    });
  } catch {
    return Response.json(
      {
        error: "BAD_GATEWAY",
        code: "errors.gateway.unavailable",
        message: "Backend unavailable.",
      },
      { status: 502 }
    );
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return forwardRequest(request, context);
}