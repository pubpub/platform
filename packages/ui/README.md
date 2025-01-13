# PubPub UI

## How to import

You need to import the component from the `ui/\<component\>` path. For example:

```tsx
import { Button } from "ui/button"
import { Loader2 } from "ui/icon"
```

## How to add a new component

1. Create a file in src, something like `src/component.tsx`, that exports a _named_ Component. Ideally copy-paste something from https://ui.shadcn.com/components
2. Add that file to `package.json['entryPoints']` as `component.tsx`
3. Add component to the `package.json['files']` array
4. In packages/ui, run `pnpm preconstruct fix && pnpm preconstruct dev`
5. Everything should be good!

## Rationale for our style approach

In the past, PubPub has stuck pretty close to the style system offered by the off-the-shelf component library we've used (primarily BlueprintJS). This is convenient because it allowed us to move quickly early on, but has become a liability over time as our design needs to deviate from the Blueprint design, and as the Blueprint library introduces breaking changes.

In v7, we find ourselves with an additional styling objective, which is to allow integrations (both 1st and 3rd party) to easily adopt the styles and design of `core`. Further, we hope to do this without requiring every integration to use the exact same technical stack as `core`.

Other important considerations include site-wide theming capabilities, robust Figma offerings, and performance (this was a noticeable issue with Blueprint as PubPub v6 scaled).

Other minor considerations include a preference to avoid CSS-in-JS approaches, size of the open source community, sustainability of the library (having a library stop maintenance because it had no business model puts us in a tough position), component-level bundling (_all_ of BlueprintJS ships with every page even if we only used a single component), and friendliness with server-side rendering (i.e. no FOUC while it waits for client-side JS to load).

In experimenting with different component libraries and workflows, a consistent fork in the road kept appearing. We can either:

1. pick a React library and require integrations to use React if they want to be styled similarly, or
2. we need to pick an approach that works in vanilla HTML

The first approach would let us choose something like Chakra, Mantine, or Blueprint. The second approach leaves us essentially choosing between writing all CSS classes ourselves or picking a tool like Tailwind.

I feel strongly that integrations shouldn't _have_ to use the same stack as us (i.e. React), so spent time focusing on approach (2). Down that path, Tailwind offers a lot that writing our own classes from scratch does not. Writing raw CSS everywhere feels too difficult to maintain for a large project and I think we’d frankly wind up essentially re-implementing tailwind, but with less familiarity for integration developers and worse documentation. Further,

-   It’s got great documentation with best practices and a huge community
-   It has tons of community Figma boards
-   It lets us offer a simple configuration plugin (i.e. `plugins: [require("pubpub/styles")]`) that defines colors, borders, fonts, etc that could allow integrations to easily get good-enough similarity with little other work.

So, if we run with the assumption that we'll use Tailwind and integrations have to drop in Tailwind to achieve similar styling, the next question is: Do we build components ourselves or take off the shelf ones? The question feels trivial: we shouldn't try to rebuild complex UI components from scratch. Accessibility is hard. Cross-browser support for edge case interactions is hard.

I spent some time playing with Flowbite, which offers an extensive component library built from native HTML and tailwind css. Flowbite even offers a 1st-party React library of their components. Unfortunately, Flowbite-React seems insufficient for us. It still has a good deal of bugs, does not have complete component coverage, and their experimental theming is doing a JS theming thing instead of just using tailwind config (! So it winds up essentially being the same as Chakra or Mantine, in that the component library bundles its styles with it).

So, at the end of that thinking, the approach that I think optimizes for our constraints and provides the best DX experience is to:

1. Pick a framework agnostic theming approach
2. Choose a ui library that doesn’t break your theming approach
3. Build your components

Because integrations that are written with a different framework won't be able to replicate our choice of (2) or (3) anyways, the only commitment is essentially (1).

This also gives us a lot of flexibility in building components. We can mix and match headless libraries if we want — there's no problem having, for example, both Radix and AriaKit since they aren’t fighting for style. We're not forced into a monolithic decision. Of course, headless component libraries have a lot of overlap, so I expect we would mostly use the same one, but from the perspective integration developers and performance, there's really no "commitment" beyond tailwind.

On top of Tailwind, there is a lot of good community work to draw from:

-   Radix and shadcn/ui
-   AriaKit components
-   HeadlessUI and open source TailwindUI components built on top of it
-   Countless Tailwind component libraries
-   Countless Tailwind Figma boards

The other perk of this approach is that all component styling is kept in pubpub-core, as opposed to deep in some node module. This makes it a bit easier for someone who's trying to port a component into Vue or Svelte and want it to look like PubPub components — the core HTML and tailwind classes are easily found.

In the end, this approach resonates with me because:

-   It feels as close to vanilla CSS as we can get without forcing ourselves to write all our classes and components from scratch.
-   It's performant since it's just CSS at the end of the day (especially compared to monolithic component libraries like Blueprint).
-   It offers integration developers a simple approach to add our tailwind config as a plugin.
-   It allows our components to use headless UI libraries focused on accessibility.
-   We maintain complete control of top-level components and styling.

The primary tradeoff to all of this is a little more up front work compared to using something like Chakra, but there is so much community offering that I don't feel concerned about our ability to build quickly.

## Links and Resources

A list of resources I found helpful in my spike:

-   [CSS Solution Analysis for Polaris Foundations](https://docs.google.com/spreadsheets/d/1rxrRTlbNWiLVu-Q5IK7xh5O1FmWcjyAS2XN7jiPrhYM/edit#gid=0)
    -   An in depth analysis of different CSS approaches. A few years old, and notably, current Tailwind has addressed nearly all its issues (multiple themes and build-time performance).
-   [Tailwind](https://tailwindcss.com/)
-   [shadcn/ui](https://ui.shadcn.com/)
-   [Radix](https://www.radix-ui.com/)
-   [Chakra](https://chakra-ui.com/)
-   [Mantine](https://mantine.dev/)
-   [HeadlessUI](https://headlessui.com/)
-   [AriaKit](https://ariakit.org/)
-   [Flowbite](https://flowbite.com/)
-   [Flowbite-React](https://www.flowbite-react.com/)
