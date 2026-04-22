import Image from "next/image";

const stages = [
  {
    day: "Day 1",
    date: "Sunday, 6 September 2026 — 10h00",
    title: "Luxembourg City → Moselle Valley",
    description:
      "Depart from the Glacis car park in Luxembourg City, winding south through the vineyards of the Moselle. Afternoon wine-tasting at a family-run Crémant estate. Evening gala dinner in Remich.",
    image: "/moselle-tour.jpeg",
    distance: "95 km",
  },
  {
    day: "Day 2",
    date: "Sunday, 6 September 2026 — 10h45 Briefing",
    title: "Moselle → Bourscheid Castle",
    description:
      "The signature stage. Traverse the Our Valley and Ardennes foothills to the dramatic hilltop fortress of Bourscheid. Concours d'élégance judging in the castle grounds, followed by a medieval-themed gala.",
    image: "/bourscheid-castle.webp",
    distance: "110 km",
  },
  {
    day: "Day 3",
    date: "Sunday, 6 September 2026",
    title: "Bourscheid → Luxembourg City",
    description:
      "A leisurely return via the Mullerthal Trail — Luxembourg's Little Switzerland — with its dramatic rock formations and emerald streams. Closing ceremony and prize-giving at the Grand Ducal Palace forecourt.",
    image: "/luxembourg-classic.jpg",
    distance: "75 km",
  },
];

export default function RouteSection() {
  return (
    <section id="route" className="bg-off-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-10 bg-sage" />
          <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">
            The Route
          </span>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-16">
          <h2 className="font-heading text-forest text-4xl sm:text-5xl font-bold tracking-[-0.02em] leading-tight">
            Three Days,
            <br />
            <em className="not-italic text-sage">130 Kilometres</em>
          </h2>
          <p className="text-warm-gray text-lg leading-[1.8] lg:pt-2 self-end">
            Each stage is hand-picked for its scenic beauty and road quality —
            from river valleys to medieval hilltop fortresses.
          </p>
        </div>

        {/* Stages */}
        <div className="space-y-8">
          {stages.map((stage, i) => (
            <div
              key={stage.day}
              className={`group grid md:grid-cols-5 gap-0 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(45,106,79,0.08)] hover:shadow-[0_12px_48px_rgba(45,106,79,0.15)] transition-shadow duration-300 border border-border ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <div
                className={`relative h-56 md:h-auto md:col-span-2 overflow-hidden ${
                  i % 2 === 1 ? "md:order-last" : ""
                }`}
              >
                <Image
                  src={stage.image}
                  alt={stage.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase bg-sage/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                    {stage.distance}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="md:col-span-3 bg-white px-8 py-8 lg:px-12 lg:py-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center font-heading">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-forest text-sm">{stage.day}</div>
                    <div className="text-warm-gray text-xs">{stage.date}</div>
                  </div>
                </div>

                <h3 className="font-heading text-forest text-2xl lg:text-3xl font-bold mb-4 tracking-tight leading-snug">
                  {stage.title}
                </h3>
                <p className="text-warm-gray text-base leading-[1.8]">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Map placeholder */}
        <div className="mt-16 rounded-2xl overflow-hidden border border-border shadow-[0_4px_24px_rgba(45,106,79,0.08)] relative h-72 bg-pale-sage flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-forest text-xl">🗺</span>
            </div>
            <p className="text-forest font-heading font-semibold text-lg">Interactive Route Map</p>
            <p className="text-warm-gray text-sm mt-1">Coming soon — detailed route PDF available upon registration</p>
          </div>
        </div>
      </div>
    </section>
  );
}
