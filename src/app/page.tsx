import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import HighlightCards from "@/components/HighlightCards";
import Gallery from "@/components/Gallery";
import RegisterCTA from "@/components/RegisterCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <HighlightCards />
        <Gallery />
        <RegisterCTA />
      </main>
      <Footer />
    </>
  );
}
