import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import Gallery from '../components/sections/Gallery';
import Skills from '../components/sections/Skills';
import Reviews from '../components/sections/Reviews';

export default function HomePage() {
  return (
    <main className="page-shell section-stack">
      <Header />
      <Hero />
      <Gallery />
      <Skills />
      <Reviews />
      <Footer />
    </main>
  );
}
