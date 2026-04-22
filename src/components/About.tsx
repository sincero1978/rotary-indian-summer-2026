import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="bg-off-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-10 bg-sage" />
          <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">
            About the Rally
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — text */}
          <div>
            <h2 className="font-heading text-forest text-4xl sm:text-5xl font-bold leading-tight tracking-[-0.02em] mb-6">
              9th Rotary Indian
              <br />
              <em className="not-italic text-sage">Summer Tour</em>
            </h2>

            <p className="text-warm-gray text-base leading-[1.8] mb-4">
              The Rotary Club of Bascharage-Kordall is organizing its 9th annual
              &ldquo;Rotary Indian Summer Tour&rdquo; charity rally, dedicated to classic
              and sports cars, on September 6, 2026.
            </p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">
              The event returns with enthusiasm and has been revamped with a few
              adjustments to offer an even more appealing experience for
              enthusiasts of historic automobiles and sports cars.
            </p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">
              The primary goal of Rotary International is to leverage
              relationships and contacts to serve the common good and advance
              understanding among peoples, goodwill, and respect for peace
              through friendly relations among members of all professions united
              by the ideal of service.
            </p>
            <p className="text-warm-gray text-base leading-[1.8] mb-4">
              It is in this spirit that our club organizes the Rotary Indian
              Summer Rally, a rally for enthusiasts of historic and sports cars,
              a convivial event whose proceeds will support our club&apos;s
              charitable activities.
            </p>
            <p className="text-warm-gray text-base leading-[1.8] mb-6 font-medium text-forest/80">
              All profits will be dedicated to social and humanitarian causes.
            </p>

            {/* Event info block */}
            <div className="bg-pale-sage rounded-xl px-5 py-4 mb-8 border border-border flex flex-col gap-1">
              <div className="flex items-center gap-2 text-forest font-semibold text-sm">
                <span className="text-sage">📅</span> Sunday, September 6, 2026
              </div>
              <div className="flex items-center gap-2 text-warm-gray text-sm">
                <span className="text-sage">📍</span> Start &amp; Finish: Mess-Café / Reckange-sur-Mess
              </div>
              <div className="flex items-center gap-2 text-warm-gray text-sm">
                <span className="text-sage">🗺</span> Route book with arrows (no average speed to maintain)
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              {[
                { value: "1", label: "Day", sub: "6 Sep 2026" },
                { value: "130", label: "km", sub: "Scenic route" },
                { value: "60+", label: "Vehicles", sub: "Classic & sports cars" },
              ].map(({ value, label, sub }) => (
                <div key={label}>
                  <div className="font-heading text-forest text-3xl font-bold leading-none">
                    {value}
                    <span className="text-sage text-xl ml-0.5">{label}</span>
                  </div>
                  <div className="text-warm-gray text-sm mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image stack */}
          <div className="relative h-[480px] lg:h-[560px]">
            {/* Background card */}
            <div className="absolute top-0 right-0 w-[82%] h-[88%] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(45,106,79,0.15)]">
              <Image
                src="/luxembourg-indian-summer.webp"
                alt="Luxembourg in autumn"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
            </div>
            {/* Foreground card */}
            <div className="absolute bottom-0 left-0 w-[55%] h-[52%] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(45,106,79,0.22)] border-4 border-off-white">
              <Image
                src="/old-timer-rally.jpg"
                alt="Classic car at the rally"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute top-4 left-4 bg-forest text-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(45,106,79,0.35)]">
              <div className="font-heading text-3xl font-bold leading-none text-sage">
                9th
              </div>
              <div className="text-white/60 text-[10px] tracking-[0.18em] uppercase mt-0.5">
                Edition
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
