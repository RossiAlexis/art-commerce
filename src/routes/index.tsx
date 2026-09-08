import { createFileRoute } from "@tanstack/react-router";

import { getHomepage } from "#/features/homepage/homepage.functions";

export const Route = createFileRoute("/")({
  // loader: () => getHomepage(),
  head: () => ({
    meta: [
      {
        title: "Art by Vero Miller - ¡Hola!",
      },
      {
        name: "description",
        content:
          "Discover original paintings by Vero Miller and explore her art portfolio.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  // const { homepage, paintings } = Route.useLoaderData()

  return (
    <main className="">
      <div className="flex h-80 w-screen">
        <img
          src="https://images.unsplash.com/photo-1784318519037-7ee0b1668e95?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          className="block aspect-1440/580 max-h-[580px] min-h-[220px] object-cover"
          width={1440}
          height={580}
        />
      </div>
      {/* {homepage ? (
        <section className="flow-root">
          {homepage.image ? (
            <img
              src={`/resources/homepage-image/${homepage.image.id}`}
              alt={homepage.image.altText ?? homepage.title}
              className="mb-5 aspect-auto w-40 rounded-sm object-cover shadow-sm sm:float-left sm:mb-2 sm:mr-7 md:w-64"
            />
          ) : null}
          <h1 className="font-display text-6xl leading-none text-[#3f4f23] md:text-8xl">
            {homepage.title}
          </h1>
          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-stone-700 md:text-lg md:leading-8">
            {homepage.text}
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="homepage-gallery-heading"
        className="mt-12 md:mt-20"
      >
        <h2
          id="homepage-gallery-heading"
          className="text-center font-serif text-xl italic text-stone-800 md:text-2xl"
        >
          Explore my gallery and find a piece that connects with you! ♡
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {paintings.map((painting) => {
            const image = painting.images.at(0)
            if (!image) return null

            return (
              <a
                key={painting.id}
                href="/paintings"
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#688329]"
              >
                <img
                  src={`/resources/note-images/${image.id}`}
                  alt={image.altText ?? painting.title}
                  className="aspect-square w-full rounded-sm object-cover shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                />
              </a>
            )
          })}
        </div>
      </section> */}
    </main>
  );
}
