import Image from "next/image";

const photos = [
  { src: "/gallery-1.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-2 row-span-2", size: "large" },
  { src: "/gallery-2.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-3.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-4.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-5.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-7.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-2 row-span-1", size: "wide" },
  { src: "/gallery-8.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
  { src: "/gallery-6.jpg", alt: "Rotary Indian Summer Tour 2026", span: "col-span-1 row-span-1", size: "small" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="bg-forest py-24 lg:py-32 grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-sage/50" />
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">
              The Experience
            </span>
            <div className="h-px w-10 bg-sage/50" />
          </div>
          <h2 className="font-heading text-white text-4xl sm:text-5xl font-bold tracking-[-0.02em]">
            Captured in Light
          </h2>
          <p className="mt-4 text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Luxembourg&apos;s autumn is unlike any other. Golden vineyards,
            ancient stone fortresses, and roads that seem to have been made for
            classic cars.
          </p>
        </div>

        {/* Masonry grid */}
        <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[640px] lg:h-[740px]">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl group cursor-pointer ${photo.span}`}
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes={
                  photo.size === "large"
                    ? "(max-width: 768px) 100vw, 66vw"
                    : photo.size === "wide"
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 50vw, 33vw"
                }
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-[transform,opacity] duration-300">
                <p className="text-white text-sm font-medium leading-tight">{photo.alt}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA below gallery */}
        <div className="mt-12 text-center">
          <p className="text-white/50 text-sm tracking-wide">
            Full photo gallery available to registered participants after the rally
          </p>
        </div>
      </div>
    </section>
  );
}
