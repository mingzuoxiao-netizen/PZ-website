
import React from 'react';
import { Scale } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="mb-12 border-b border-stone-200 pb-8">
            <div className="flex items-center text-amber-700 mb-4">
                <Scale size={24} className="mr-3" />
                <span className="font-bold uppercase tracking-[0.2em] text-xs">Legal Documentation</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">Terms of Service</h1>
            <p className="text-stone-500 font-mono text-xs">Last Updated: October 24, 2024</p>
        </div>

        <div className="space-y-12 text-stone-600 leading-relaxed text-sm md:text-base">
            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">1. Agreement to Terms</h2>
                <p>
                    These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and PZ Precision Woodworks ("we," "us," or "our"), concerning your access to and use of our website. By accessing the site, you acknowledge that you have read, understood, and agree to be bound by all of these Terms of Service.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">2. Intellectual Property Rights</h2>
                <p className="mb-4">
                    Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                </p>
                <p>
                    The Content and the Marks are provided on the Site "AS IS" for your information and personal use only. Except as expressly provided in these Terms of Service, no part of the Site and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">3. Products and Manufacturing</h2>
                <p className="mb-4">
                    We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors, and your electronic display may not accurately reflect the actual colors and details of the products.
                </p>
                <p className="mb-4">
                    All products manufactured by PZ Precision Woodworks are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">4. Limitations of Liability</h2>
                <p>
                    In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">5. Governing Law</h2>
                <p>
                    These Terms shall be governed by and defined following the laws of The People's Republic of China. PZ Precision Woodworks and yourself irrevocably consent that the courts of China shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">6. Changes to Terms</h2>
                <p>
                    We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Service at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of these Terms of Service, and you waive any right to receive specific notice of each such change.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
