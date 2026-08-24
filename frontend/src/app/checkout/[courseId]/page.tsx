"use client";
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CreditCard, ShieldCheck, ChevronLeft, Check } from 'lucide-react';

export default function Checkout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
          <Check size={40} />
        </div>
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-neutral-400 text-lg mb-8 max-w-md text-center">You are now enrolled in Full-Stack Next.js Masterclass. A receipt has been sent to your email.</p>
        <Link href="/learn/1" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg">
          Start Learning Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      <header className="h-20 border-b border-neutral-800 bg-neutral-950 flex items-center px-6 md:px-12 justify-between">
        <Link href="/courses/1" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
          <ChevronLeft size={20} /> Back to Course
        </Link>
        <div className="flex items-center gap-2 text-neutral-400">
          <ShieldCheck size={20} className="text-emerald-500" /> Secure Checkout
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Payment Form */}
        <div>
          <h1 className="text-3xl font-bold mb-8">Complete your enrollment</h1>
          
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-neutral-800 pb-2">Payment Method</h3>
              
              <div className="bg-neutral-900 border border-blue-500 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                <input type="radio" checked readOnly className="w-5 h-5 accent-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Credit / Debit Card</p>
                </div>
                <CreditCard className="text-neutral-400" />
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Name on card</label>
                  <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Card number</label>
                  <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Expiry date</label>
                    <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">CVC</label>
                    <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono" placeholder="123" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] mt-8 flex justify-center items-center h-16"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Pay $99.00'
              )}
            </button>
            <p className="text-xs text-center text-neutral-500">By completing this purchase you agree to these Terms of Service.</p>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:border-l border-neutral-800 lg:pl-12 lg:ml-12 pt-12 lg:pt-0 border-t lg:border-t-0">
          <h3 className="text-xl font-bold mb-6">Order Summary</h3>
          
          <div className="flex gap-4 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=300&auto=format&fit=crop" alt="Thumbnail" className="w-24 h-16 rounded-lg object-cover bg-neutral-800" />
            <div className="flex-1">
              <h4 className="font-semibold text-white">Full-Stack Next.js Masterclass</h4>
              <p className="text-sm text-neutral-400">Dr. Smith</p>
            </div>
            <div className="font-bold">$99.00</div>
          </div>

          <div className="space-y-4 border-t border-neutral-800 pt-6">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span>$99.00</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Tax</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-white font-bold text-xl pt-4 border-t border-neutral-800">
              <span>Total</span>
              <span>$99.00</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
