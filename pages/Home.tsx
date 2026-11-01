import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Boxes, ClipboardList, Cog, Factory,
  Globe2, PackageCheck, PenTool, ShieldCheck, Truck
} from 'lucide-react';
import { usePublishedSiteConfig } from '../contexts/SiteConfigContext';
import { resolveImage } from '../utils/imageResolver';
import { useLanguage } from '../contexts/LanguageContext';
import { categories as defaultCategories } from '../data/inventory';
import { homepageSiteCategories } from '../utils/catalogCategories';

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
  { title: 'Wood Surfaces & Components', titleZh: '木制台面与组件', descZh: '砧板、工作台面、厨房岛台和实木层板。', desc: 'Butcher blocks, work surfaces, kitchen islands and shelving.', id: 'butcher-block', aliases: ['butcher-block', 'wood surfaces'], fallback: defaultCategories.find(c => c.id === 'butcher-block')?.image || '' },
  { title: 'Dining & Seating', titleZh: '餐桌椅系列', descZh: '适用于住宅和商业项目的餐桌、餐椅及长凳。', desc: 'Dining tables, chairs and benches for residential and commercial use.', id: 'tables', aliases: ['tables', 'seating', 'dining'], fallback: defaultCategories.find(c => c.id === 'tables')?.image || '' },
  { title: 'Casegoods & Storage', titleZh: '柜类与储物家具', descZh: '餐边柜、电视柜、书架及配套家具。', desc: 'Sideboards, media units, bookcases and complementary furniture.', id: 'cabinetry', aliases: ['cabinetry', 'casegoods', 'storage'], fallback: defaultCategories.find(c => c.id === 'cabinetry')?.image || '' }
];

const processSteps = [
  { icon: ClipboardList, number: '01', title: 'Project Brief', titleZh:'项目需求', textZh:'提供产品参考、规格与采购要求。', text: 'Share product references, specifications and commercial requirements.' },
  { icon: Boxes, number: '02', title: 'Development & Sampling', titleZh:'开发与打样', textZh:'确认材料、结构、涂装与样品要求。', text: 'Review materials, construction, finishes and sample requirements.' },
  { icon: Cog, number: '03', title: 'Manufacturing', titleZh:'批量生产', textZh:'按照确认的产品规格组织生产。', text: 'Move into production following approved product specifications.' },
  { icon: Truck, number: '04', title: 'Quality Review & Delivery', titleZh:'品质检验与交付', textZh:'根据约定要求检查成品与包装。', text: 'Inspect products and packaging against agreed requirements before shipment.' }
];

const Home: React.FC = () => {
  const { config: site, loading, isFallback } = usePublishedSiteConfig();
  const { language } = useLanguage();
  const L = (english: string, chinese: string) => language === "zh" ? chinese : english;

  // The English headline is managed in Admin > 网站基础信息.
  // Keep a curated Chinese headline until bilingual titles are supported by the schema.
  const configuredHeadline = site?.home?.hero?.title?.trim();
  const heroHeadline = language === 'zh'
    ? '专注实木制造，助力品牌成长。'
    : (configuredHeadline || 'Solid Wood Furniture. Built for Your Brand.');
  const heroImage = resolveImage(site?.home?.hero?.image) || FALLBACK_HERO;
  const factoryImage = resolveImage(site?.home?.factory?.image) || FALLBACK_FACTORY;
  const chinaImage = resolveImage(site?.home?.hub_cn?.image) || FALLBACK_FACTORY;
  const cambodiaImage = resolveImage(site?.home?.hub_kh?.image) || FALLBACK_FACTORY;
  const materialImages = [
    site?.materials?.wood_oak,
    site?.materials?.wood_walnut,
    site?.materials?.wood_ash,
    site?.materials?.wood_rubber
  ].filter((item): item is string => typeof item === 'string' && item.length > 0);

  const homeCategories = homepageSiteCategories(site?.categories);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef] text-[#735a4a]" role="status">Loading PZ Furniture Studio...</div>;
  }

  return (
    <div className="bg-[#fcfaf7] text-[#30221b]">
      {isFallback && (
        <div role="status" className="bg-[#f4e5d3] text-[#694329] px-5 py-2 text-center text-xs">
          {L('Content connection is temporarily unavailable. Displaying saved website information.','内容连接暂时不可用，正在显示备用网站信息。')}
        </div>
      )}

      {/* 01 — editorial lead; image and headline remain editable through existing admin fields */}
      <section className="relative pt-[70px] md:pt-[76px] bg-[#eee8df] overflow-hidden" aria-label={L('PZ Furniture Studio introduction','鹏展家具制造介绍')}>
        <div className="grid lg:grid-cols-[43%_57%] min-h-[620px] xl:min-h-[700px]">
          <div className="relative z-10 flex flex-col justify-between px-6 sm:px-10 lg:pl-[max(48px,calc((100vw-1330px)/2))] lg:pr-9 pt-16 pb-12 md:pt-20 lg:pt-20 lg:pb-12 bg-[#eee8df]">
            <div className="max-w-[610px]">
              <div className="flex items-center gap-4">
                <span className="h-px w-9 bg-[#986344]" aria-hidden="true" />
                <p className={sectionKicker}>{L('Independent Furniture Manufacturing Partner','家具品牌的制造合作伙伴')}</p>
              </div>
              <h1 className={editorialHeading + ' mt-8 text-[clamp(2.8rem,5.2vw,5.75rem)] break-words'}>
                {heroHeadline}
              </h1>
              <p className="text-[#5f5952] text-[15px] md:text-[16px] leading-[1.85] mt-7 max-w-[495px]">
                {L('From solid wood components to finished furniture, we support brands, importers and commercial buyers with development and production across China and Cambodia.','从实木组件到成品家具，我们依托中国与柬埔寨的生产基地，为品牌、进口商及商业采购商提供产品开发与制造支持。')}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/collections" className={darkButton}>{L('Explore Our Collections','探索产品系列')} <ArrowRight size={15} aria-hidden="true" /></Link>
                <Link to="/inquire" className="inline-flex items-center justify-center gap-3 border border-[#a18d7e] px-6 py-3.5 text-[12px] font-semibold text-[#4c392d] hover:bg-white/70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754831]">
                  {L('Start a Project','咨询合作')} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="mt-12 pt-5 border-t border-[#cdbfb3] flex items-center gap-5">
              <span className="font-serif text-[27px] leading-none text-[#674732]">PZ.</span>
              <p className="text-[11px] tracking-[0.11em] uppercase leading-relaxed text-[#806f61]">
                {L('Designed for partnership · Made for scale','面向长期合作 · 服务规模化制造')}
              </p>
            </div>
          </div>
          <div className="relative min-h-[390px] lg:min-h-full overflow-hidden bg-[#534438]">
            <img
              src={heroImage}
              alt={L('PZ furniture and manufacturing visual','鹏展家具与制造形象图')}
              className="absolute inset-0 h-full w-full object-cover object-center"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1711]/65 via-transparent to-[#1e1711]/10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-7 md:p-10 text-white">
              <div>
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/75">{L('The PZ Manufacturing Network','鹏展制造网络')}</p>
                <p className="mt-2 font-serif text-xl md:text-2xl">{L('China / Cambodia','中国 / 柬埔寨')}</p>
              </div>
              <Link to="/manufacturing" className="inline-flex items-center gap-2 px-3 py-2 border border-white/60 bg-black/20 text-white text-[11px] font-medium hover:bg-white hover:text-[#30221b] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                {L('Our Process','制造流程')} <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — clear reasons to consider PZ */}
      <section className="bg-white border-b border-[#eee6de]" aria-label="Manufacturing highlights">
        <div className="max-w-[1330px] mx-auto grid grid-cols-2 lg:grid-cols-4 px-6 md:px-10">
          {[
            { icon: Globe2, title: 'Two Production Bases', titleZh:'两大生产基地', descZh:'中国肇庆与柬埔寨干丹', desc: 'Zhaoqing, China & Kandal, Cambodia' },
            { icon: PenTool, title: 'OEM / ODM Support', titleZh:'OEM / ODM 定制支持', descZh:'产品开发与打样', desc: 'Product development and sampling' },
            { icon: Boxes, title: 'Solid Wood Expertise', titleZh:'实木制造专长', descZh:'实木台面、家具和柜类', desc: 'Butcher blocks, furniture and casegoods' },
            { icon: ShieldCheck, title: 'Global Supply', titleZh:'国际供应合作', descZh:'服务品牌、进口商和商业项目', desc: 'For brands, importers and commercial projects' }
          ].map(({ icon: Icon, title, titleZh, desc, descZh }) => (
            <div key={title} className="flex items-start gap-3.5 py-7 px-2 lg:px-6 border-b lg:border-b-0 border-[#eee6de] first:lg:pl-0">
              <Icon size={27} strokeWidth={1.5} className="text-[#885338] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-[13px] text-[#38271f]">{language === 'zh' ? titleZh : title}</h2>
                <p className="text-[#807a75] text-[11px] leading-[1.6] mt-1">{language === 'zh' ? descZh : desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — categories are always visible, even with zero published SKUs */}
      <section className="py-16 md:py-20 bg-[#fcfaf7]" aria-labelledby="what-we-make">
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 grid lg:grid-cols-[28%_72%] gap-9 lg:gap-0">
          <div className="lg:pr-12 flex flex-col justify-center">
            <p className={sectionKicker}>{L("Curated Wood & Furniture Categories","精选实木与家具系列")}</p>
            <h2 id="what-we-make" className={editorialHeading + ' text-4xl md:text-5xl mt-4'}>{L("What We Make","我们能够制造什么")}</h2>
            <p className="text-[#77716a] text-[14px] leading-[1.8] mt-5 max-w-[340px]">
              {L('Explore our furniture and wood product capabilities, developed for different markets, applications and commercial requirements.','浏览我们面向不同市场与商业项目的家具及木制品系列。')}
            </p>
            <Link to="/collections" className="group inline-flex items-center gap-3 mt-7 text-[#754831] font-semibold text-[13px] underline underline-offset-4">
              {L('View All Products','查看全部产品')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 lg:pl-4">
            {homeCategories.map(category => {
              const curated = categories.find(item => item.aliases.some(alias =>
                category.id.toLowerCase() === alias || category.title.toLowerCase().includes(alias)));
              const title = curated
                ? (language === 'zh' ? curated.titleZh : curated.title)
                : (language === 'zh' ? (category.title_zh || category.title) : category.title);
              const description = curated
                ? (language === 'zh' ? curated.descZh : curated.desc)
                : (language === 'zh' ? (category.description_zh || category.description || category.subtitle_zh || category.subtitle) : (category.description || category.subtitle));
              const image = resolveImage(category.image) || curated?.fallback || '';
              return (
                <Link key={category.id} to={'/collections?category=' + encodeURIComponent(category.id)}
                  className="group bg-white shadow-[0_8px_28px_rgba(52,37,28,0.05)] border border-[#f0e9e2] hover:shadow-[0_14px_35px_rgba(52,37,28,0.13)] transition-all">
                  <div className="relative aspect-[4/3] sm:aspect-[4/4] overflow-hidden bg-[#e8ded3]">
                    {image && <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  </div>
                  <div className="px-4 py-4 relative">
                    <ArrowUpRight size={15} aria-hidden="true" className="absolute right-4 top-5 text-[#91593d]"/>
                    <h3 className="font-serif text-[18px] leading-snug pr-5 text-[#30221b]">{title}</h3>
                    <p className="text-[#82786f] text-[11px] leading-relaxed mt-2">{description}</p>
                  </div>
                </Link>
              );
            })}          </div>
        </div>
      </section>

      {/* 04 — human craftsmanship + four-step workflow */}
      <section className="grid lg:grid-cols-[42%_58%] bg-white" aria-labelledby="workflow-title">
        <div className="relative min-h-[390px] lg:min-h-[380px] overflow-hidden bg-[#3a2b22]">
          <img src={factoryImage} alt="PZ furniture workshop team member seen from behind" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e130e]/90 via-[#1e130e]/65 to-[#1e130e]/20" />
          <div className="relative z-10 max-w-[510px] px-7 md:px-12 py-12 lg:py-14 flex flex-col justify-center h-full">
            <p className="text-white/80 tracking-[0.18em] uppercase text-[10px] font-semibold">{L("From Concept to Production","从概念到量产")}</p>
            <h2 id="workflow-title" className="font-serif text-[clamp(2rem,2.65vw,3.2rem)] text-white tracking-[-0.03em] leading-tight mt-4">
              {L('A Manufacturing Partner, Not Just a Supplier.','值得信赖的制造合作伙伴，而不仅是供应商。')}
            </h2>
            <p className="mt-4 text-[13px] md:text-sm text-white/85 leading-[1.75]">
              {L('We work with your team from product requirements and sampling through production and quality review.','我们与您的团队紧密合作，从产品需求、打样到量产及品质检验。')}
            </p>
            <Link to="/inquire" className="self-start inline-flex items-center gap-3 mt-7 bg-white text-[#754831] hover:bg-[#f4e8dd] px-5 py-3.5 font-semibold uppercase tracking-[0.025em] text-xs transition-colors">
              {L('Discuss Your Project','洽谈您的项目')} <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
        <div className="px-6 md:px-9 xl:px-12 py-11 lg:py-16 grid grid-cols-2 xl:grid-cols-4 gap-7 lg:gap-5 items-start">
          {processSteps.map(({ icon: Icon, number, title, titleZh, text, textZh }) => (
            <div key={number} className="flex flex-col gap-4">
              <Icon size={31} strokeWidth={1.45} className="text-[#875338]"/>
              <div>
                <span className="font-serif text-2xl text-[#885338] mr-2">{number}</span>
                <h3 className="inline text-[#3a2a22] text-[14px] font-semibold leading-snug">{language === "zh" ? titleZh : title}</h3>
              </div>
              <p className="text-[12px] text-[#817a72] leading-[1.75]">{language === "zh" ? textZh : text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — two facilities / materials */}
      <section className="bg-[#f9f6f1] py-12 md:py-16 border-y border-[#eee5dc]">
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 grid lg:grid-cols-[27%_45%_28%] gap-9 lg:gap-0">
          <div className="lg:pr-8">
            <p className={sectionKicker}>{L("Our Manufacturing Network","我们的制造网络")}</p>
            <h2 className={editorialHeading + ' text-3xl md:text-4xl mt-3'}>{L("China & Cambodia","中国与柬埔寨")}</h2>
            <p className="text-[#77716a] text-[13px] leading-[1.75] mt-4">{L("Coordinated product management and manufacturing across two locations, supporting a flexible supply network.","两地生产基地协同开展产品管理与制造，为客户提供灵活的供应支持。")}</p>
            <Link to="/capacity" className="inline-flex items-center gap-2 text-[#754831] text-[13px] font-semibold underline underline-offset-4 mt-5">{L('Explore Our Facilities','了解生产基地')} <ArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:pr-8">
            {[
              { name: 'Zhaoqing, China', nameZh: '中国肇庆', desc: 'Headquarters and main production base.', descZh:'总部与主要生产基地。', image: chinaImage },
              { name: 'Kandal, Cambodia', nameZh:'柬埔寨干丹', desc: 'An additional manufacturing location.', descZh:'支持生产业务的另一座工厂。', image: cambodiaImage }
            ].map(item => (
              <Link to="/capacity" key={item.name} className="group">
                <div className="aspect-[4/3] bg-[#e5ded5] overflow-hidden"><img src={item.image} alt={item.name + ' manufacturing facility'} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/></div>
                <h3 className="font-serif text-[14px] text-[#30221b] text-center mt-3">{language === "zh" ? item.nameZh : item.name}</h3>
                <p className="text-[#817a72] text-[11px] leading-snug text-center mt-1">{language === "zh" ? item.descZh : item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-[#dbd0c5] pt-7 lg:pt-0 lg:pl-9">
            <p className={sectionKicker}>{L("Materials & Craftsmanship","材料与工艺")}</p>
            <h2 className={editorialHeading + ' text-3xl md:text-4xl mt-3'}>{L("Detail in Every Material.","从材料细节开始。")}</h2>
            <p className="text-[#77716a] text-[13px] leading-[1.75] mt-4">{L("Wood species, construction methods and finish options to support different product designs.","提供多种木材、结构工艺与涂装选择，满足不同产品设计需求。")}</p>
            <div className="flex gap-1.5 mt-5" aria-label="Material examples">
              {materialImages.length ? materialImages.map((image, idx) => <img key={idx} src={resolveImage(image)} alt={'Wood material sample ' + (idx + 1)} loading="lazy" className="h-9 w-16 object-cover" />) :
                ['#b67b49','#845432','#d4aa78','#9b6943'].map(color => <span key={color} className="h-9 w-14" style={{backgroundColor:color}} aria-hidden="true"/>)}
            </div>
            <Link to="/materials" className="inline-flex items-center gap-2 text-[#754831] text-[13px] font-semibold underline underline-offset-4 mt-5">{L('Explore Materials & Quality','了解材料与品质')} <ArrowRight size={14}/></Link>
          </div>
        </div>
      </section>

      {/* 06 — direct conversion */}
      <section className="relative overflow-hidden bg-[#352219] text-white" aria-label="Start a project">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{backgroundImage: 'url(' + (resolveImage(site?.home?.cta?.image) || heroImage) + ')'}}/>
        <div className="max-w-[1330px] mx-auto px-6 md:px-10 relative z-10 py-9 md:py-11 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
          <div className="md:flex-1">
            <p className="text-white/65 tracking-[0.19em] uppercase text-[10px]">{L("Let's Work Together","与我们合作")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2 tracking-tight">{L("Have a Product in Mind?","您有新的产品项目吗？")}</h2>
          </div>
          <p className="md:flex-1 max-w-[440px] text-white/80 text-[13px] leading-relaxed">{L("Tell us about your product, target market, specifications and estimated order volume. Our team can review the details.","告诉我们您的产品、目标市场、规格和预计采购数量，我们的团队将与您进一步沟通。")}</p>
          <Link to="/inquire" className="inline-flex shrink-0 items-center justify-center gap-3 px-7 py-4 text-[12px] font-semibold bg-[#805036] hover:bg-[#9b6446] transition-colors">{L('Request a Quote','获取报价')} <ArrowRight size={16}/></Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
