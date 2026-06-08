import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Create a raw HTML response that we will attach session cookies to
  const response = new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Email Verified | BarberQueue</title>
        <style>
          body {
            background-color: #17130c;
            color: #ebe1d6;
            font-family: ui-sans-serif, system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #231f18;
            border: 1px solid #4e4637;
            padding: 40px;
            text-align: center;
            max-width: 420px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          h1 {
            color: #f0bf5c;
            margin-top: 0;
            font-size: 26px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          p {
            color: #9b8f7d;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Email Confirmed</h1>
          <p>Your email has been verified successfully. You can now close this tab and return to the system window to proceed to your dashboard.</p>
        </div>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );

  if (token_hash && type) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return response;
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
}
