import { Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { listenToMessages, sendMessage } from "~/api/firebase/db";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  messagesSchema,
  messagingSchema,
  type MessagingForm,
} from "~/validations/session";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

interface SessionMessagingProps {
  sessionId: string | null;
}

export default function SessionMessaging(props: SessionMessagingProps) {
  const [messages, setMessages] = useState<string[]>([]);

  const { control, handleSubmit, formState } = useForm<MessagingForm>({
    resolver: zodResolver(messagingSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit: SubmitHandler<MessagingForm> = (form) => {
    if (props.sessionId) sendMessage(props.sessionId, form.message);
  };

  useEffect(() => {
    if (props.sessionId)
      return listenToMessages(props.sessionId, (val) => {
        const res = messagesSchema.safeParse(val);
        if (res.success)
          setMessages(Object.values(res.data).map((value) => value.message));
      });
  }, [props.sessionId]);

  return (
    <Stack gap={1} sx={{ height: "100%" }}>
      <Stack
        gap={1}
        sx={{
          height: "100%",
          background: (theme) => theme.vars?.palette.background.default,
          borderRadius: (theme) => theme.shape.borderRadius,
        }}
      >
        {messages.map((message, index) => (
          <Typography
            key={index}
            sx={{
              borderRadius: (theme) => theme.shape.borderRadius,
              bgcolor: (theme) => theme.vars?.palette.primary.main,
              color: (theme) => theme.vars?.palette.primary.contrastText,
              p: 0.5,
              px: 2,
              maxWidth: "min-content",
            }}
          >
            {message}
          </Typography>
        ))}
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid alignItems="center" container justifyContent="center" spacing={1}>
          <Grid size={10}>
            <Controller
              control={control}
              name="message"
              render={(args) => (
                <TextField
                  {...args.field}
                  error={Boolean(args.fieldState.error)}
                  fullWidth
                  helperText={args.fieldState.error?.message}
                  placeholder="Message"
                />
              )}
            />
          </Grid>
          <Grid size={2} sx={{ height: "100%" }}>
            <Button
              disabled={props.sessionId === null}
              fullWidth
              loading={formState.isSubmitting}
              sx={{ height: 56 }}
              type="submit"
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </form>
    </Stack>
  );
}
