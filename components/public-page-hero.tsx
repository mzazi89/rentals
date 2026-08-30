/**
 * Photo banner used at the top of public content pages so every page has a
 * real background image.
 */
export function PublicPageHero({
  title,
  subtitle,
  image,
  children,
}: {
  title: string;
  subtitle?: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden text-white">
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />
      <div className="container relative mx-auto max-w-4xl py-16 text-center sm:py-20">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85 sm:text-base">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export const PAGE_IMAGES = {
  dusk: "https://sc02.alicdn.com/kf/Aee86ed55183f40e5b6d3be876c8896816.png",
  interior: "https://sc02.alicdn.com/kf/Ab8730c0b48284b1ea8fa9315126ccbf10.png",
  facade: "https://sc02.alicdn.com/kf/Acaa288531963497ca06aad3e9afd3c0cA.png",
} as const;
