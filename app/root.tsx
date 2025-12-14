import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import ReactRouterAppProvider from "./providers/RouterRouterAppProvider";
import theme from "./styles/theme";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { Authentication, Session } from "@toolpad/core/AppProvider";
import { firebaseSignOut, signInWithGoogle } from "./api/firebase/auth";
import type { User } from "firebase/auth";
import { firebaseAuth } from "./api/firebase/config";

const AUTHENTICATION: Authentication = {
  signIn: signInWithGoogle,
  signOut: firebaseSignOut,
};

export function Layout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {props.children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    /**
     * Subscribes to the `onIdTokenChanged` event to monitor across the app the
     * authentication state of the user. Sets the session state accordingly.
     */
    const unsubscribe = firebaseAuth.onIdTokenChanged((user: User | null) => {
      if (user) {
        setSession({
          user: {
            name: user.displayName || "",
            email: user.email || "",
            image: user.photoURL || "",
          },
        });
      } else {
        setSession(null);
      }
    });
    /**
     * Unsubscribe from the `onIdTokenChanged` event
     */
    return () => unsubscribe();
  }, []);

  return (
    <ReactRouterAppProvider
      authentication={AUTHENTICATION}
      session={session}
      theme={theme}
    >
      <Outlet />
    </ReactRouterAppProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
