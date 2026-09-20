import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export function withValidation<T>(
  schema: z.Schema<T>,
  handler: (req: NextRequest, data: T, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // For GET requests, validate search params. For POST/PUT/PATCH, validate JSON body.
      let inputData: any = {};
      if (req.method === "GET") {
        inputData = Object.fromEntries(req.nextUrl.searchParams.entries());
      } else {
        const text = await req.text();
        if (text) {
          inputData = JSON.parse(text);
        }
      }

      const parsed = schema.safeParse(inputData);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // Pass the sanitized, parsed data and context to the handler
      return handler(req, parsed.data, context);
    } catch (error) {
      // If req.json() fails to parse invalid JSON, it throws an error
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
  };
}
