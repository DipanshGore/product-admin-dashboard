import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
        
        {/* Playful Image Container */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <div className="relative w-full max-w-sm hover:-translate-y-2 transition-transform duration-500 ease-out">
            <img 
              src="/404 image.jpg" 
              alt="Confused character looking at a 404 error" 
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Text and Actions */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-red-500 tracking-wider uppercase">
              Page Not Found
            </h2>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Oops! We lost <br className="hidden md:block" /> this page.
            </h1>
          </div>
          
          <p className="text-lg text-gray-500 leading-relaxed max-w-md mx-auto md:mx-0">
            It looks like you've wandered into a broken link. The product or route you're looking for doesn't exist in our directory anymore.
          </p>
          
          <div className="pt-4 flex justify-center md:justify-start">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              <svg 
                className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Head Back to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}