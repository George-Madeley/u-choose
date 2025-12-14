import {
  SignInPage,
  type AuthProvider,
  type AuthResponse,
} from "@toolpad/core";
import { useNavigate } from "react-router";
import {
  signInWithCredentials,
  signInWithGoogle,
  type SignInReturn,
} from "~/api/firebase/auth";

export default function Page() {
  const navigate = useNavigate();

  const handleSignIn = async (
    provider: AuthProvider,
    formData?: FormData
  ): Promise<AuthResponse> => {
    let result: SignInReturn | null = null;
    try {
      if (provider.id === "google") {
        result = await signInWithGoogle();
      }
      if (provider.id === "credentials") {
        const email = formData?.get("email") as string;
        const password = formData?.get("password") as string;

        if (!email || !password) {
          return { error: "Email and password are required" };
        }

        result = await signInWithCredentials(email, password);
      }

      if (result?.success && result?.user) {
        navigate("/");
        return {};
      }
      return { error: "Failed to sign in" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };
  return (
    <SignInPage
      providers={[
        { id: "google", name: "Google" },
        { id: "credentials", name: "Credentials" },
      ]}
      signIn={handleSignIn}
      slotProps={{
        emailField: {
          defaultValue: "toolpad-demo@mui.com",
        },
        passwordField: {
          defaultValue: "@demo1",
        },
      }}
    />
  );
}
