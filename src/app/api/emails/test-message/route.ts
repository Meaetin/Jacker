import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createGmailClient } from "@/lib/gmail/client";
import { parseGmailMessage } from "@/lib/gmail/parse-raw";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokens } = await supabase
    .from("user_tokens")
    .select()
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokens) {
    return NextResponse.json({ error: "No Gmail tokens" }, { status: 400 });
  }

  const auth = createGmailClient(
    tokens.gmail_access_token ?? "",
    tokens.gmail_refresh_token
  );

  const gmail = google.gmail({ version: "v1", auth });
  const messageId = request.nextUrl.searchParams.get("id");
  const subject = request.nextUrl.searchParams.get("subject");

  let targetId = messageId;

  // If no ID provided, search by subject query
  if (!targetId && subject) {
    const { data: list } = await gmail.users.messages.list({
      userId: "me",
      q: `subject:(${subject})`,
      maxResults: 1,
    });
    targetId = list.messages?.[0]?.id ?? null;
    if (!targetId) {
      return NextResponse.json({ error: `No message found with subject: "${subject}"` }, { status: 404 });
    }
  }

  if (!targetId) {
    return NextResponse.json({ error: "Provide ?id=MESSAGE_ID or ?subject=SUBJECT" }, { status: 400 });
  }

  const { data: full } = await gmail.users.messages.get({
    userId: "me",
    id: targetId,
    format: "full",
  });

  const parsed = parseGmailMessage(full);

  return NextResponse.json({
    gmailFields: {
      id: full.id,
      threadId: full.threadId,
      internalDate: full.internalDate,
      labelIds: full.labelIds,
      snippet: full.snippet,
    },
    parsed,
  });
}
