import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { noindexMeta } from '#/features/seo/seo'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/design-system')({
  head: () => ({
    meta: [{ title: 'Art by Vero Miller - Design system' }, ...noindexMeta()],
  }),
  component: DesignSystemPage,
})

type Swatch = {
  name: string
  cssVar: string
  hex: string
  description: string
}

const SWATCHES: Array<Swatch> = [
  {
    name: 'Base',
    cssVar: '--background',
    hex: '#FDF9F4',
    description: 'Fondo general',
  },
  {
    name: 'Surface',
    cssVar: '--card',
    hex: '#F0EBE3',
    description: 'Cards / secciones · también muted y secondary',
  },
  {
    name: 'Border',
    cssVar: '--border',
    hex: '#E2D8CE',
    description: 'Bordes / divisores · también input',
  },
  {
    name: 'Text',
    cssVar: '--foreground',
    hex: '#1C1917',
    description: 'Texto principal',
  },
  {
    name: 'Mid',
    cssVar: '--muted-foreground',
    hex: '#7C756F',
    description: 'Texto secundario',
  },
  {
    name: 'Terracota',
    cssVar: '--primary',
    hex: '#C27A5A',
    description: 'Acento A · primary',
  },
  {
    name: 'Terracota claro',
    cssVar: '--accent',
    hex: '#FCEBE3',
    description: 'Fondo de acento',
  },
  {
    name: 'Terracota oscuro',
    cssVar: '--primary-hover',
    hex: '#993F17',
    description: 'Hover de primary · también ring',
  },
  {
    name: 'Destructive',
    cssVar: '--destructive',
    hex: '#DF202E',
    description: 'Errores / eliminar (fuera de la paleta original)',
  },
]

function DesignSystemPage() {
  const [dark, setDark] = useState(false)

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDark((value) => !value)
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">
            Design system
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paleta de colores, tipografía y componentes derivados de los
            tokens en <code>src/styles.css</code>.
          </p>
        </div>
        <Button variant="outline" onClick={toggleDark}>
          {dark ? 'Light mode' : 'Dark mode'}
        </Button>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">
          Paleta de colores
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {SWATCHES.map((swatch) => (
            <div key={swatch.cssVar}>
              <div
                className="h-20 rounded-lg border border-border"
                style={{ backgroundColor: `var(${swatch.cssVar})` }}
              />
              <p className="mt-2 text-sm font-medium text-foreground">
                {swatch.name}
              </p>
              <p className="text-xs text-muted-foreground">{swatch.hex}</p>
              <p className="text-xs text-muted-foreground">{swatch.cssVar}</p>
              <p className="text-xs text-muted-foreground">
                {swatch.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">Tipografía</h2>
        <div className="mt-4 space-y-4">
          <p className="font-sans text-2xl text-foreground">
            Open Sans — font-sans
          </p>
          <p className="font-serif text-2xl text-foreground">
            Playfair Display — font-serif
          </p>
          <p className="font-display text-3xl text-foreground">
            Shadows Into Light — font-display
          </p>
          <p className="max-w-prose font-sans text-sm text-muted-foreground">
            Body copy in font-sans at text-sm, the default reading size used
            across the portfolio for descriptions and secondary content.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">Botones</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">Badges</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">Card</h2>
        <Card className="mt-4 max-w-sm">
          <CardHeader>
            <CardTitle>Sunset over the bay</CardTitle>
            <CardDescription>Oil on canvas, 60 × 80 cm</CardDescription>
            <CardAction>
              <Badge variant="secondary">CAD $450</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A warm study of light on water, part of the Coastal category.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">View painting</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium text-foreground">Input</h2>
        <div className="mt-4 max-w-sm space-y-1">
          <label
            htmlFor="design-system-email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input id="design-system-email" placeholder="you@example.com" />
        </div>
      </section>
    </main>
  )
}
