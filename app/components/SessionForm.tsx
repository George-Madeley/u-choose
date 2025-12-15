import { Button, Grid, TextField } from "@mui/material";
import { createSession } from "~/api/firebase/db";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { sessionSchema, type SessionForm } from "~/validations/session";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Dispatch, type SetStateAction } from "react";

interface SessionFormProps {
  setSessionId: Dispatch<SetStateAction<string | null>>;
}

export default function SessionForm(props: SessionFormProps) {
  const { control, handleSubmit, setValue, formState } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      sessionId: "",
    },
  });

  const onSubmit: SubmitHandler<SessionForm> = (form) => {
    props.setSessionId(form.sessionId);
  };

  const handleCreate = async () => {
    setValue("sessionId", await createSession());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid columns={12} container spacing={1}>
        <Grid size={12}>
          <Button
            disabled={formState.isSubmitting}
            fullWidth
            onClick={handleCreate}
            sx={{ height: 56 }}
          >
            Create
          </Button>
        </Grid>
        <Grid size={10}>
          <Controller
            control={control}
            name="sessionId"
            render={(args) => (
              <TextField
                {...args.field}
                error={Boolean(args.fieldState.error)}
                fullWidth
                helperText={args.fieldState.error?.message}
                placeholder="Session Id"
              />
            )}
          />
        </Grid>
        <Grid size={2}>
          <Button
            fullWidth
            loading={formState.isSubmitting}
            sx={{ height: 56 }}
            type="submit"
          >
            Join
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
