import { Stack } from "@mui/material";
import SessionForm from "../components/SessionForm";
import SessionMessaging from "~/components/SessionMessaging";
import { useState } from "react";

export default function Page() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <Stack
      gap={1}
      justifyContent="space-between"
      sx={{ width: "100%", height: "100%" }}
    >
      <SessionForm setSessionId={setSessionId} />
      <SessionMessaging sessionId={sessionId} />
    </Stack>
  );
}
