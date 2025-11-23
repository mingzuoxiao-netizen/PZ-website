import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const INQUIRY_API = 'https://pz-inquiry-api.mingzuoxiao29.workers.dev';

const Inquire: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    type: 'General',
    message: '',
    website: typeof window !== 'undefined' ? window.location.href : '', // ✅ 更稳
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL ?subject=Catalog 自动填充
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

  // ======================================
  //  改动 1：handleChange 使用函数式更新 
  // ======================================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value })); // ✅ 更安全
  };

  // ==================================================================
  //                            提交
  // ==================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
          website: formData.website, // 🚀 已添加
          source: 'website',
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // 本地 Admin demo 同步
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
        'There was a problem sending your inquiry. Please try again or contact us directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 成功页面
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
                website: typeof window !== 'undefined' ? window.location.href : '', // ❗ 保持一致
              });
            }}
            className="text-stone-500 underline hover:text-stone-900"
          >
            {t.inquire.form.again}
          </button>
        </div>
      </div>
    );
  }

  // 表单页面
  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* 左侧介绍部分 */}
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

          {/* 右侧表单 */}
          <div
            className="bg-white p-8 md:p-12 border border-stone-200 shadow-xl"
            id="inquiry-form"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 隐藏输入：website */}
              <input type="hidden" name="website" value={formData.website} />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center text-sm">
                  <AlertCircle size={16} className="mr-2" />
                  {error}
                </div>
              )}

              {/* 姓名 + 公司 */}
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

              {/* 邮箱 */}
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

              {/* 类型 */}
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

              {/* 内容 */}
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

              {/* 提交按钮 */}
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
