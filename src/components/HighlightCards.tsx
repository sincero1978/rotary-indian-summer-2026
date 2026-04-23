import { MapPin, Clock, Trophy, Users, Camera, HeartHandshake } from "lucide-react";

const highlights = [
  {
    icon: MapPin,
    title: "Spectacular Landscapes",
    body: "Wind through Luxembourg's golden autumn vineyards, forest passes, and the dramatic Moselle River valley.",
    accent: "130 km of scenic roads",
  },
  {
    icon: Clock,
    title: "One-Day Rally",
    body: "A carefully curated programme blending driving stages and cultural visits. Start: 10h00 · Briefing: 10h45.",
    accent: "6 September 2026",
  },
  {
    icon: Trophy,
    title: "Classic & Sports Cars Welcome",
    body: "Open to classic and sports cars.",
    accent: "All classes eligible",
  },
  {
    icon: Users,
    title: "Rotary Fellowship",
    body: "Organised by Rotary Club Bascharage-Kordall, with all net proceeds supporting local and international charitable projects.",
    accent: "Giving back together",
  },
  {
    icon: HeartHandshake,
    title: "Supporting a Good Cause",
    body: "All net proceeds from the rally go directly towards supporting charitable causes locally and internationally, in true Rotary spirit.",
    accent: "Service Above Self",
  },
  {
    icon: Camera,
    title: "Unforgettable Memories",
    body: "Professional photographers will be on hand throughout the day to capture every moment. All participants receive access to the full event photo gallery after the rally.",
    accent: "Full photo gallery access",
  },
];

export default function HighlightCards() {
  return (
    <section className="bg-pale-sage py-24 lg:py-32 grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-10 bg-sage" />
            <span className="text-sage text-xs font-semibold tracking-[0.28em] uppercase">
              Rally Highlights
            </span>
            <div className="h-px w-10 bg-sage" />
          </div>
          <h2 className="font-heading text-forest text-4xl sm:text-5xl font-bold tracking-[-0.02em]">
            Everything You Need to Know
          </h2>
          <p className="mt-4 text-warm-gray text-lg max-w-2xl mx-auto leading-relaxed">
            Every detail considered, every road chosen for beauty. The Indian
            Summer Rally is designed to be the motoring event of the year.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {highlights.map(({ icon: Icon, title, body, accent }) => (
            <div
              key={title}
              className="group bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(45,106,79,0.07)] hover:shadow-[0_12px_40px_rgba(45,106,79,0.14)] transition-[box-shadow,transform] duration-300 hover:-translate-y-1 border border-border"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-pale-sage flex items-center justify-center mb-6 group-hover:bg-sage/15 transition-colors duration-300">
                <Icon size={22} className="text-forest" />
              </div>

              <h3 className="font-heading text-forest text-xl font-bold mb-3 tracking-tight">
                {title}
              </h3>
              <p className="text-warm-gray text-sm leading-[1.8] mb-5">{body}</p>

              {/* Accent tag */}
              <div className="inline-flex items-center gap-2 bg-pale-sage rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                <span className="text-forest text-xs font-medium">{accent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
