import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const INQUIRY_API = 'https://pz-inquiry-api.mingzuoxiao29.workers.dev';

// 🔴 IMPORTANT: Replace with your actual Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = '0x4AAAAAACCcwDofTxqfYxSe'; 

// TypeScript definition for window.turnstile
declare global {
  interface Window {
    turnstile: any;
  }
}

const Inquire: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    type: 'General',
    message: '',
    website: typeof window !== 'undefined' ? window.location.href : '',
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill subject from URL
  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject === 'Catalog') {
      setFormData((prev) => ({
        ...prev,
        type: 'Catalog Request',
        message: 'I would like to request a PDF copy of your product catalog.',
      }));
    }
  }, [searchParams]);

  // Render Turnstile Widget
  useEffect(() => {
    // Function to render the widget
    const renderTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        // Clear previous instance if any (though usually handled by react unmount)
        turnstileContainerRef.current.innerHTML = '';
        
        window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (token: string) => {
            setTurnstileToken(token);
            setError(''); // Clear error if they fix the captcha
          },
          'expired-callback': () => {
            setTurnstileToken('');
            setError('Security check expired. Please verify again.');
          },
        });
      }
    };

    // If script is already loaded
    if (window.turnstile) {
      renderTurnstile();
    } else {
      // If script loads later (though index.html loads it, this is a safety check)
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderTurnstile();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Verify Turnstile Token exists on client side
    if (!turnstileToken) {
        setError(language === 'zh' ? '请完成安全验证' : 'Please complete the security check.');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(INQUIRY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          product_type: formData.type,
          message: formData.message,
          website: formData.website,
          source: 'website',
          'cf-turnstile-response': turnstileToken, // Send token to backend
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Local storage backup for Admin Dashboard demo
      const newInquiry = {
        id: Math.random().toString(36).substring(2, 9),
        ...formData,
        product_type: formData.type,
        source: 'website',
        date: new Date().toISOString().split('T')[0],
        status: 'New',
        createdAt: new Date().toISOString(),
      };

      const existingInquiries = JSON.parse(
        localStorage.getItem('pz_inquiries') || '[]'
      );

      localStorage.setItem(
        'pz_inquiries',
        JSON.stringify([newInquiry, ...existingInquiries])
      );

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setError(
        language === 'zh' 
          ? '发送失败，请稍后重试或直接联系我们。' 
          : 'There was a problem sending your inquiry. Please try again or contact us directly.'
      );
      // Reset Turnstile on error so user can try again
      if (window.turnstile) window.turnstile.reset();
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-stone-50 min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center px-6">
          <CheckCircle className="mx-auto text-amber-700 mb-6" size={64} />
          <h2 className="text-3xl font-serif text-stone-900 mb-4">
            {t.inquire.form.success}
          </h2>
          <p className="text-stone-600 mb-8">{t.inquire.form.successDesc}</p>

          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: '',
                company: '',
                email: '',
                type: 'General',
                message: '',
                website: typeof window !== 'undefined' ? window.location.href : '',
              });
              setTurnstileToken('');
            }}
            className="text-stone-500 underline hover:text-stone-900"
          >
            {t.inquire.form.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side Content */}
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-8">
              {t.inquire.title}
            </h1>
            <p className="text-stone-600 text-lg leading-relaxed mb-12">
              {t.inquire.desc}
            </p>

            <div className="space-y-8 border-t border-stone-200 pt-8">
              <div>
                <h3 className="text-stone-900 font-bold mb-2">
                  {t.inquire.trade}
                </h3>
                <p className="text-stone-500 text-sm">
                  {t.inquire.tradeDesc}
                </p>
              </div>

              <div>
                <h3 className="text-stone-900 font-bold mb-2">
                  {t.inquire.oem}
                </h3>
                <p className="text-stone-500 text-sm">
                  {t.inquire.oemDesc}
                </p>
              </div>

              <div className="flex items-start">
                <BookOpen
                  className="text-amber-700 mt-1 mr-3 flex-shrink-0"
                  size={20}
                />
                <div>
                  <h3 className="text-stone-900 font-bold mb-2">
                    {t.inquire.catalog}
                  </h3>
                  <p className="text-stone-500 text-sm">
                    {t.inquire.catalogDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Form */}
          <div
            className="bg-white p-8 md:p-12 border border-stone-200 shadow-xl"
            id="inquiry-form"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="website" value={formData.website} />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center text-sm">
                  <AlertCircle size={16} className="mr-2" />
                  {error}
                </div>
              )}

              {/* Name & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                    {t.inquire.form.name}
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                    {t.inquire.form.company}
                  </label>
                  <input
                    required
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                  {t.inquire.form.email}
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                  {t.inquire.form.type}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3"
                >
                  <option value="General">{t.inquire.types.general}</option>
                  <option value="Catalog Request">{t.inquire.types.catalog}</option>
                  <option value="Trade Program">{t.inquire.types.trade}</option>
                  <option value="OEM/ODM">{t.inquire.types.oem}</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                  {t.inquire.form.message}
                </label>
                <textarea
                  required
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 resize-none"
                ></textarea>
              </div>

              {/* Turnstile Security Check */}
              <div className="pt-2">
                 <div ref={turnstileContainerRef} className="min-h-[65px]"></div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 text-white font-bold uppercase tracking-widest py-4 hover:bg-amber-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors flex justify-center items-center shadow-md"
              >
                {loading ? (
                  <>
                    {t.inquire.form.sending}{' '}
                    <Loader2 size={16} className="ml-2 animate-spin" />
                  </>
                ) : (
                  <>
                    {t.inquire.form.send}{' '}
                    <Send size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquire;