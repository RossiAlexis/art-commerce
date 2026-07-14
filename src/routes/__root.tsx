import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Instagram } from 'lucide-react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Art by Vero Miller',
      },
      {
        name: 'description',
        content: 'Original paintings and art by Vero Miller.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function SiteShell({ children }: { children: React.ReactNode }) {
  const links = [
    { label: '¡Hola!', href: '/' },
    { label: 'Paintings', href: '/paintings' },
    { label: 'Contact me', href: '/contact-me' },
  ]

  return (
    <div className="min-h-screen md:grid md:grid-cols-[20rem_1fr]">
      <aside className="sticky top-0 z-20 flex h-24 items-center justify-between border-b border-stone-900 bg-[#ebc9a8] px-5 md:h-screen md:flex-col md:border-b-0 md:border-r md:px-8 md:py-10">
        <Link
          to="/"
          aria-label="Art by Vero Miller Homepage"
          className="font-serif text-xl leading-tight font-semibold tracking-wide text-stone-900 md:text-center md:text-3xl"
        >
          Art by
          <span className="block font-display text-3xl font-normal text-[#526a27] md:text-5xl">
            Vero Miller
          </span>
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-4 md:flex-col md:gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="nav-link text-xs tracking-[0.12em] uppercase md:text-base"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="https://www.instagram.com/artbyveromiller"
          target="_blank"
          rel="noreferrer"
          aria-label="Art by Vero Miller on Instagram"
          className="hidden rounded-full p-2 text-[#526a27] transition hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526a27] md:block"
        >
          <Instagram aria-hidden="true" />
        </a>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
