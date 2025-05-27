import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = ''; // Reset on cleanup
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      className="fixed inset-0 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white/90 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-blue-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const openGmail = (email) => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, "_blank");
  };

  const navigateToHeadquarters = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=16.93883862462309,74.40837081269919`,
          "_blank"
        );
      },
      () => {
        window.open(
          "https://www.google.com/maps/dir/?api=1&destination=16.93883862462309,74.40837081269919",
          "_blank"
        );
      }
    );
  };

  const footerInfo = {
    about: {
      title: "About UNSS Tech",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Founded in 2023, UNSS Tech is a pioneering force in AI-powered image generation technology. 
            We are committed to democratizing visual content creation by developing intuitive, powerful AI tools.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Our Mission</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Empower creators with cutting-edge AI technologies</li>
              <li>Make advanced image generation accessible</li>
              <li>Maintain the highest ethical standards in AI development</li>
            </ul>
          </div>
        </div>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      content: (
        <div className="space-y-4">
          <section className="mb-4">
            <h3 className="font-semibold text-lg text-blue-800 mb-2">Data Protection</h3>
            <p className="text-gray-700 leading-relaxed">
              We prioritize your privacy by collecting only essential information required to provide our services. 
              Our commitment is to transparency and minimal data collection.
            </p>
          </section>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="font-medium text-green-800 mb-2">🔒 Privacy Guarantees</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>End-to-end data encryption</li>
              <li>No unauthorized data sharing</li>
              <li>Regular privacy audits</li>
              <li>User data control options</li>
            </ul>
          </div>
        </div>
      ),
    },
    terms: {
      title: "Terms of Service",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            By using our services, you agree to maintain ethical and responsible use of our AI technologies.
          </p>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h4 className="font-medium text-red-800 mb-2">⚠️ Key Usage Guidelines</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Respect intellectual property rights</li>
              <li>No hate speech or discriminatory content</li>
              <li>No illegal or harmful imagery</li>
              <li>Comply with our content guidelines</li>
            </ul>
          </div>
        </div>
      ),
    },
    refund: {
      title: "Refund & Cancellation Policy",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            At UNSS Tech, customer satisfaction is our top priority. We offer a transparent refund and cancellation policy for all purchases.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h4 className="font-semibold text-yellow-800 mb-2">📌 Policy Details</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Refunds available within 7 days of purchase for eligible products</li>
              <li>Cancellations must be requested via email with order details</li>
              <li>Refunds processed within 5–10 business days</li>
              <li>Non-refundable items include custom and one-time-use services</li>
            </ul>
          </div>
        </div>
      ),
    },
    faq: {
      title: "FAQs / Help Center",
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-blue-800 mb-2">🧠 Frequently Asked Questions</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>Q:</strong> How do I generate an image?<br />
                <span className="ml-4">A: Simply input your prompt and click "Generate." Our AI will process and create the image in seconds.</span>
              </li>
              <li>
                <strong>Q:</strong> Is there a free trial available?<br />
                <span className="ml-4">A: Yes! We offer a limited free plan to explore basic features.</span>
              </li>
              <li>
                <strong>Q:</strong> How do I report inappropriate content?<br />
                <span className="ml-4">A: Please email us at <span className="text-blue-500 cursor-pointer" onClick={() => openGmail("sujalshaha974@gmail.com")}>sujalshaha974@gmail.com</span> with a screenshot or description.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    contact: {
      title: "Contact Us",
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">📍 Headquarters</h3>
              <p className="text-gray-700">
                101 Gandhinagar Ashta - 416301<br />
                Maharashtra, India
              </p>
              <button 
                onClick={navigateToHeadquarters}
                className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Get Directions
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center">📞 Support</h3>
              <p className="text-gray-700">
                +91 7517053282<br />
                Monday-Friday: 9am-5pm IST
              </p>
              <p className="mt-2 text-sm text-gray-600">Response within 24 hours guaranteed</p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-4">
            <h3 className="font-semibold text-purple-800 mb-2 flex items-center">📧 Email Contacts</h3>
            <div className="space-y-2">
              <p>General: 
                <span 
                  className="text-blue-500 hover:underline cursor-pointer ml-2"
                  onClick={() => openGmail("sujalshaha974@gmail.com")}
                >
                  sujalshaha974@gmail.com
                </span>
              </p>
              <p>Support: 
                <span 
                  className="text-blue-500 hover:underline cursor-pointer ml-2"
                  onClick={() => openGmail("sujalshaha774@gmail.com")}
                >
                  sujalshaha774@gmail.com
                </span>
              </p>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <>
      <footer className="bg-gradient-to-r from-blue-50 to-purple-50 py-12 mt-20 border-t border-gray-100">
        <div className="container mx-auto max-w-screen-lg px-6">
          <div className="flex flex-wrap items-center justify-between gap-8 mb-8">
            <div className="transition-all duration-300 hover:scale-105">
              <img src={assets.logo} alt="UNSS Tech Logo" width={180} className="drop-shadow-sm" />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6"></div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600 text-center">
              {Object.keys(footerInfo).map((key) => (
                <button 
                  key={key}
                  onClick={() => setActiveModal(key)} 
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  {footerInfo[key].title}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              &copy; {new Date().getFullYear()} <span className="text-blue-600 font-medium">UNSS Tech</span> | All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {activeModal && (
          <Modal 
            isOpen={!!activeModal} 
            onClose={closeModal} 
            title={footerInfo[activeModal].title}
          >
            {footerInfo[activeModal].content}
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;
