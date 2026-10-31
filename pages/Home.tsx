import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Boxes, ClipboardList, Cog, Factory,
  Globe2, PackageCheck, PenTool, ShieldCheck, Truck
} from 'lucide-react';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { resolveImage } from '../utils/imageResolver';
import { categories as defaultCategories } from '../data/inventory';

/**
 * Website 2.0 — editorial public homepage.
 * This remains a presentation-only change: catalog and inquiry workflows are
 * owned by the existing API/Creator routes. Factory images are configurable.
 */
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=85&w=1800&auto=format&fit=crop';
const FALLBACK_FACTORY = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=85&w=1400&auto=format&fit=crop';

const sectionKicker = 'text-[10px] md:text-[11px] font-semibold tracking-[0.19em] uppercase text-[#8b5c43]';
const darkButton = 'inline-flex items-center justify-center gap-3 bg-[#754831] hover:bg-[#573521] text-white px-6 py-3.5 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754831]';
const editorialHeading = 'font-serif font-normal tracking-[-0.045em] leading-[1.13] text-[#30221b]';

const categories = [
  { title: 'Wood Surfaces & Components', desc: 'Butcher blocks, work surfaces, kitchen islands and shelving.', id: 'butcher-block', aliases: ['butcher-block', 'wood surfaces'], fallback: defaultCategories.find(c => c.id === 'butcher-block')?.image || '' },
  { title: 'Dining & Seating', desc: 'Dining tables, chairs and benches for residential and commercial use.', id: 'tables', aliases: ['tables', 'seating', 'dining'], fallback: defaultCategories.find(c => c.id === 'tables')?.image || '' },
  { title: 'Casegoods & Storage', desc: 'Sideboards, media units, bookcases and complementary furniture.', id: 'cabinetry', aliases: ['cabinetry', 'casegoods', 'storage'], fallback: defaultCategories.find(c => c.id === 'cabinetry')?.image || '' }
];

const processSteps = [
  { icon: ClipboardList, number: '01', title: 'Project Brief', text: 'Share product references, specifications and commercial requirements.' },
  { icon: Boxes, number: '02', title: 'Development & Sampling', text: 'Review materials, construction, finishes and sample requirements.' },
  { icon: Cog, number: '03', title: 'Manufacturing', text: 'Move into production following approved product specifications.' },
  { icon: Truck, number: '04', title: 'Quality Review & Delivery', text: 'Inspect products and packaging against agreed requirements before shipment.' }
];

const Home: React.FC = () => {
  const { config: site, loading, isFallback } = usePublishedSiteConfig();

  const heroImage = resolveImage(site?.home?.hero?.image) || FALLBACK_HERO;
  const factoryImage = '/images/pz-workshop-back.png';
  const factoryFallback = resolveImage(site?.home?.factory?.image) || FALLBACK_FACTORY;
  const chinaImage = resolveImage(site?.home?.hub_cn?.image) || FALLBACK_FACTORY;
  const cambodiaImage = resolveImage(site?.home?.hub_kh?.image) || FALLBACK_FACTORY;
  const materialImages = [
    site?.materials?.wood_oak,
    site?.materials?.wood_walnut,
    site?.materials?.wood_ash,
    site?.materials?.wood_rubber
  ].filter((item): item is string => typeof item === 'string' && item.length > 0);

  const productCategories = site?.categories?.length ? site.categories : defaultCategories;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef] text-[#735a4a]" role="status">Loading PZ Furniture Studio...</div>;
  }

  return (
    <div className="bg-[#fcfaf7] text-[#30221b]">
      {isFallback && (
        <div role="status" className="bg-[#f4e5d3] text-[#694329] px-5 py-2 text-center text-xs">
          Content connection is temporarily unavailable. Displaying saved website information.
        </div>
      )}

      {/* 01 — editorial hero, split visual on desktop */}
      <section className="relative bg-[#f2ece4] lg:min-h-[615px] pt-[70px] md:pt-[76px] overflow-hidden" aria-label="PZ Furniture Studio introduction">
        <div className="grid lg:grid-cols-[46%_54%] lg:min-h-[615px]">
          <div className="relative z-10 px-6 sm:px-10 lg:pl-[max(48px,calc((100vw-1330px)/2))] lg:pr-5 py-16 lg:py-20 flex flex-col justify-center bg-[#f2ece4]">
            <p className={sectionKicker}>Furniture & Wood Component Manufacturing</p>
            <h1 className={editorialHeading + ' text-[clamp(2.7rem,4.3vw,5.2rem)] mt-6 max-w-[690px]'}>
              Solid Wood Furniture.<br />Built for Your Brand.
            </h1>
            <p className="text-[#6a6661] text-[15px] md:text-[16px] leading-[1.75] mt-6 max-w-[495px]">
              We develop and manufacture furniture and wood components for brands, importers and commercial buyers. From product development to production, our team supports projects across China and Cambodia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/collections" className={darkButton}>Explore Products <ArrowRight size={15}/></Link>
              <Link to="/manufacturing" className="inline-flex items-center justify-center gap-3 border border-[#b6a698] px-6 py-3.5 text-[12px] font-semibold hover:bg-white/70 transition-colors">Our Manufacturing <ArrowRight size={15}/></Link>
            </div>
          </div>
          <div className="relative min-h-[330px] lg:min-h-full overflow-hidden">
            <img src={heroImage} alt="Solid wood furniture in a warmly lit interior" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
            <div className="absolute inset-y-0 left-0 w-20 hidden lg:block bg-gradient-to-r from-[#f2ece4] to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2b1e16]/40 to-transparent pointer-events-none" />
            <span className="absolute bottom-7 right-8 text-white/90 text-[10px] uppercase tracking-[0.14em]">Solid Wood · Thoughtful Manufacturing</span>
          </div>
        </div>
      </section>

      {/* 02 — clear reasons to consider PZ */}
      <section className="bg-white border-b border-[#eee6de]" aria-label="Manufacturing highlights">
        <div className="max-w-[1330px] mx-auto grid grid-cols-2 lg:grid-cols-4 px-6 md:px-10">
          {[
            { icon: Globe2, title: 'Two Production Bases', desc: 'Zhaoqing, China & Kandal, Cambodia' },
            { icon: PenTool, title: 'OEM / ODM Support', desc: 'Product development and sampling' },
            { icon: Boxes, title: 'Solid Wood Expertise', desc: 'Butcher blocks, furniture and casegoods' },
            { icon: ShieldCheck, title: 'Global Supply', desc: 'For brands, importers and commercial projects' }
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5 py-7 px-2 lg:px-6 border-b lg:border-b-0 border-[#eee6de] first:lg:pl-0">
              <Icon size={27} strokeWidth={1.5} className="text-[#885338] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-[13px] text-[#38271f]">{title}</h2>
                <p className="text-[#807a75] text-[11px] leading-[1.6] mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — categories are always visible, even with zero published SKUs */}
      <section className="py-16 md:py-20 bg-[#fcfaf7]" aria-labelledby="what-we-make">
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 grid lg:grid-cols-[28%_72%] gap-9 lg:gap-0">
          <div className="lg:pr-12 flex flex-col justify-center">
            <p className={sectionKicker}>Our Product Categories</p>
            <h2 id="what-we-make" className={editorialHeading + ' text-4xl md:text-5xl mt-4'}>What We Make</h2>
            <p className="text-[#77716a] text-[14px] leading-[1.8] mt-5 max-w-[340px]">
              Explore our furniture and wood product capabilities, developed for different markets, applications and commercial requirements.
            </p>
            <Link to="/collections" className="group inline-flex items-center gap-3 mt-7 text-[#754831] font-semibold text-[13px] underline underline-offset-4">
              View All Products <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 lg:pl-4">
            {categories.map(cat => {
              const configured = productCategories.find(item =>
                cat.aliases.some(a => item.id?.toLowerCase() === a || item.title?.toLowerCase().includes(a)));
              const image = resolveImage(configured?.image) || cat.fallback;
              return (
                <Link key={cat.id} to={'/collections?category=' + encodeURIComponent(configured?.id || cat.id)} className="group bg-white shadow-[0_8px_28px_rgba(52,37,28,0.05)] border border-[#f0e9e2] hover:shadow-[0_14px_35px_rgba(52,37,28,0.13)] transition-all">
                  <div className="relative aspect-[4/3] sm:aspect-[4/4] overflow-hidden bg-[#e8ded3]">
                    {image && <img src={image} alt={cat.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  </div>
                  <div className="px-4 py-4 relative">
                    <ArrowUpRight size={15} className="absolute right-4 top-5 text-[#91593d]"/>
                    <h3 className="font-serif text-[18px] leading-snug pr-5 text-[#30221b]">{cat.title}</h3>
                    <p className="text-[#82786f] text-[11px] leading-relaxed mt-2">{cat.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04 — human craftsmanship + four-step workflow */}
      <section className="grid lg:grid-cols-[42%_58%] bg-white" aria-labelledby="workflow-title">
        <div className="relative min-h-[390px] lg:min-h-[380px] overflow-hidden bg-[#3a2b22]">
          <img src={factoryImage} alt="PZ furniture workshop team member seen from behind" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = factoryFallback; }} className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e130e]/90 via-[#1e130e]/65 to-[#1e130e]/20" />
          <div className="relative z-10 max-w-[510px] px-7 md:px-12 py-12 lg:py-14 flex flex-col justify-center h-full">
            <p className="text-white/80 tracking-[0.18em] uppercase text-[10px] font-semibold">From Concept to Production</p>
            <h2 id="workflow-title" className="font-serif text-[clamp(2rem,2.65vw,3.2rem)] text-white tracking-[-0.03em] leading-tight mt-4">
              A Manufacturing Partner, Not Just a Supplier.
            </h2>
            <p className="mt-4 text-[13px] md:text-sm text-white/85 leading-[1.75]">
              We work with your team from product requirements and sampling through production and quality review.
            </p>
            <Link to="/inquire" className="self-start inline-flex items-center gap-3 mt-7 bg-white text-[#754831] hover:bg-[#f4e8dd] px-5 py-3.5 font-semibold uppercase tracking-[0.025em] text-xs transition-colors">
              Discuss Your Project <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
        <div className="px-6 md:px-9 xl:px-12 py-11 lg:py-16 grid grid-cols-2 xl:grid-cols-4 gap-7 lg:gap-5 items-start">
          {processSteps.map(({ icon: Icon, number, title, text }) => (
            <div key={number} className="flex flex-col gap-4">
              <Icon size={31} strokeWidth={1.45} className="text-[#875338]"/>
              <div>
                <span className="font-serif text-2xl text-[#885338] mr-2">{number}</span>
                <h3 className="inline text-[#3a2a22] text-[14px] font-semibold leading-snug">{title}</h3>
              </div>
              <p className="text-[12px] text-[#817a72] leading-[1.75]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — two facilities / materials */}
      <section className="bg-[#f9f6f1] py-12 md:py-16 border-y border-[#eee5dc]">
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 grid lg:grid-cols-[27%_45%_28%] gap-9 lg:gap-0">
          <div className="lg:pr-8">
            <p className={sectionKicker}>Our Manufacturing Network</p>
            <h2 className={editorialHeading + ' text-3xl md:text-4xl mt-3'}>China & Cambodia</h2>
            <p className="text-[#77716a] text-[13px] leading-[1.75] mt-4">Coordinated product management and manufacturing across two locations, supporting a flexible supply network.</p>
            <Link to="/capacity" className="inline-flex items-center gap-2 text-[#754831] text-[13px] font-semibold underline underline-offset-4 mt-5">Explore Our Facilities <ArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:pr-8">
            {[
              { name: 'Zhaoqing, China', desc: 'Headquarters and main production base.', image: chinaImage },
              { name: 'Kandal, Cambodia', desc: 'An additional manufacturing location.', image: cambodiaImage }
            ].map(item => (
              <Link to="/capacity" key={item.name} className="group">
                <div className="aspect-[4/3] bg-[#e5ded5] overflow-hidden"><img src={item.image} alt={item.name + ' manufacturing facility'} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/></div>
                <h3 className="font-serif text-[14px] text-[#30221b] text-center mt-3">{item.name}</h3>
                <p className="text-[#817a72] text-[11px] leading-snug text-center mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-[#dbd0c5] pt-7 lg:pt-0 lg:pl-9">
            <p className={sectionKicker}>Materials & Craftsmanship</p>
            <h2 className={editorialHeading + ' text-3xl md:text-4xl mt-3'}>Detail in Every Material.</h2>
            <p className="text-[#77716a] text-[13px] leading-[1.75] mt-4">Wood species, construction methods and finish options to support different product designs.</p>
            <div className="flex gap-1.5 mt-5" aria-label="Material examples">
              {materialImages.length ? materialImages.map((image, idx) => <img key={idx} src={resolveImage(image)} alt={'Wood material sample ' + (idx + 1)} loading="lazy" className="h-9 w-16 object-cover" />) :
                ['#b67b49','#845432','#d4aa78','#9b6943'].map(color => <span key={color} className="h-9 w-14" style={{backgroundColor:color}} aria-hidden="true"/>)}
            </div>
            <Link to="/materials" className="inline-flex items-center gap-2 text-[#754831] text-[13px] font-semibold underline underline-offset-4 mt-5">Explore Materials & Quality <ArrowRight size={14}/></Link>
          </div>
        </div>
      </section>

      {/* 06 — direct conversion */}
      <section className="relative overflow-hidden bg-[#352219] text-white" aria-label="Start a project">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{backgroundImage: 'url(' + (resolveImage(site?.home?.cta?.image) || heroImage) + ')'}}/>
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 relative z-10 py-9 md:py-11 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
          <div className="md:flex-1">
            <p className="text-white/65 tracking-[0.19em] uppercase text-[10px]">Let's Work Together</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2 tracking-tight">Have a Product in Mind?</h2>
          </div>
          <p className="md:flex-1 max-w-[440px] text-white/80 text-[13px] leading-relaxed">Tell us about your product, target market, specifications and estimated order volume. Our team can review the details.</p>
          <Link to="/inquire" className="inline-flex shrink-0 items-center justify-center gap-3 px-7 py-4 text-[12px] font-semibold bg-[#805036] hover:bg-[#9b6446] transition-colors">Request a Quote <ArrowRight size={16}/></Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
