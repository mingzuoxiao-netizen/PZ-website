
import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="mb-12 border-b border-stone-200 pb-8">
            <div className="flex items-center text-amber-700 mb-4">
                <Shield size={24} className="mr-3" />
                <span className="font-bold uppercase tracking-[0.2em] text-xs">Legal Documentation</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">Privacy Policy</h1>
            <p className="text-stone-500 font-mono text-xs">Last Updated: October 24, 2024</p>
        </div>

        <div className="space-y-12 text-stone-600 leading-relaxed text-sm md:text-base">
            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">1. Introduction</h2>
                <p className="mb-4">
                    PZ Precision Woodworks ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or engage with our services.
                </p>
                <p>
                    By accessing or using our services, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">2. Information We Collect</h2>
                <p className="mb-4 font-bold text-stone-800">Personal Information</p>
                <p className="mb-4">
                    We may collect personal information that you voluntarily provide to us when you fill out an inquiry form, request a catalog, or contact our support team. This information may include:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-6">
                    <li>Name and Company Name</li>
                    <li>Email Address and Phone Number</li>
                    <li>Mailing Address (for sample kits)</li>
                    <li>Project Details and Specifications</li>
                </ul>

                <p className="mb-4 font-bold text-stone-800">Automatically Collected Information</p>
                <p>
                    When you visit our website, we may automatically collect certain information about your device and usage patterns, including your IP address, browser type, operating system, referring URLs, and pages viewed.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">We use the information we collect for specific business purposes, including:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>To provide, operate, and maintain our services.</li>
                    <li>To improve, personalize, and expand our website.</li>
                    <li>To communicate with you, including responding to inquiries and providing updates.</li>
                    <li>To process transactions and send related information, including invoices and confirmations.</li>
                    <li>To prevent fraud and ensure the security of our platform.</li>
                </ul>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">4. Sharing Your Information</h2>
                <p className="mb-4">
                    We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates.
                </p>
                <p>
                    We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">5. Data Security</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">6. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="bg-white p-6 border border-stone-200">
                    <p className="font-bold text-stone-900">PZ Precision Woodworks</p>
                    <p>Zhaoqing City, Guangdong Province, China</p>
                    <p>Email: legal@pz-precision.com</p>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
