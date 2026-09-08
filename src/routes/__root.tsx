import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Instagram } from "lucide-react";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Art by Vero Miller",
      },
      {
        name: "description",
        content: "Original paintings and art by Vero Miller.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
  shellComponent: RootDocument,
});

function StatusPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 text-center">
      {children}
      <p className="mt-8">
        <Link
          to="/"
          className="rounded bg-stone-900 px-4 py-2 text-sm text-white"
        >
          Return to the Homepage
        </Link>
      </p>
    </main>
  );
}

function NotFound() {
  return (
    <StatusPage>
      <p className="font-display text-6xl text-[#526a27]">404</p>
      <h1 className="mt-4 font-serif text-3xl text-stone-900">
        This page could not be found
      </h1>
      <p className="mt-3 text-stone-600">
        The painting or page you are looking for is not available. It may have
        been moved or is no longer part of the portfolio.
      </p>
    </StatusPage>
  );
}

function ErrorBoundary() {
  // Never surface the underlying error: no message, stack trace, or secrets
  // reach the visitor. Route/server failures show this safe boundary only.
  return (
    <StatusPage>
      <h1 className="font-serif text-3xl text-stone-900">
        Something went wrong
      </h1>
      <p className="mt-3 text-stone-600">
        We could not load this page right now. Please try again in a moment.
      </p>
    </StatusPage>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div>{children}</div>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
