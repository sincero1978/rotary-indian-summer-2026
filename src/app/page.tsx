import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import HighlightCards from "@/components/HighlightCards";
import RallyArchive from "@/components/RallyArchive";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <HighlightCards />
        <RallyArchive />
      </main>
      <Footer />
    </>
  );
}
