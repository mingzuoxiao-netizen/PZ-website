import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { Inquiry } from '../types';

const Inquire: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    type: 'General',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call / saving to admin dashboard
    const newInquiry: Inquiry = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      date: new Date().toISOString().split('T')[0],
      status: 'New'
    } as Inquiry;
    
    const existingInquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
    localStorage.setItem('inquiries', JSON.stringify([newInquiry, ...existingInquiries]));

    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="bg-stone-50 min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center px-6">
          <CheckCircle className="mx-auto text-amber-700 mb-6" size={64} />
          <h2 className="text-3xl font-serif text-stone-900 mb-4">Thank you</h2>
          <p className="text-stone-600 mb-8">Your inquiry has been received. Our team will review your project requirements and respond shortly.</p>
          <button 
            onClick={() => { setSubmitted(false); setFormData({name: '', company: '', email: '', type: 'General', message: ''}); }}
            className="text-stone-500 underline hover:text-stone-900"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-8">Start a Conversation</h1>
            <p className="text-stone-600 text-lg leading-relaxed mb-12">
              Whether you are a global furniture brand looking for an ODM partner, or an architect specifying for a commercial project, we are ready to execute your vision.
            </p>

            <div className="space-y-8 border-t border-stone-200 pt-8">
              <div>
                <h3 className="text-stone-900 font-bold mb-2">Trade Program</h3>
                <p className="text-stone-500 text-sm">Exclusive pricing and custom capabilities for interior designers and architects.</p>
              </div>
              <div>
                <h3 className="text-stone-900 font-bold mb-2">ODM / OEM Services</h3>
                <p className="text-stone-500 text-sm">Full-scale manufacturing for retail brands. Minimum order quantities apply.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 border border-stone-200 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Name</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-amber-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Company</label>
                  <input 
                    required
                    type="text" 
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-amber-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Email Address</label>
                <input 
                  required
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-amber-700 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Inquiry Type</label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-amber-700 focus:outline-none transition-colors"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Trade Program">Trade Program Application</option>
                  <option value="OEM/ODM">ODM / OEM Partnership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Message</label>
                <textarea 
                  required
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-amber-700 focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-stone-900 text-white font-bold uppercase tracking-widest py-4 hover:bg-amber-700 transition-colors flex justify-center items-center shadow-md"
              >
                Send Inquiry <Send size={16} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquire;