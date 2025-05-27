import React, { useContext, useState, useEffect } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, X, Clock, Phone, MapPin, User, MessageSquare, Calendar, CheckCircle2, Loader2 } from "lucide-react";

const BuyCredit = () => {
  const { user } = useContext(AppContext);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    agenda: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScheduleSubmitted, setIsScheduleSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Chatbot states
  const [chatHistory, setChatHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const yourPhoneNumber = "919960650886"; // Format: country code + number without '+' or '00'
  
  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', 
    '03:00 PM', '04:00 PM'
  ];

  // Chatbot steps
  const chatSteps = [
    {
      sender: "bot",
      text: "Hi there 👋 How can I assist you today?",
      options: [
        { label: "Pricing Plans", nextStep: 1 },
        { label: "Support", nextStep: 2 },
        { label: "Talk to Sales", nextStep: 3 },
      ],
    },
    {
      sender: "bot",
      text: "Here are our credit plans:",
      answer: "We offer flexible plans starting from 100 credits up to enterprise packages.",
      options: [
        { label: "View Pricing Page", nextStep: 4 },
        { label: "Talk to Sales", nextStep: 3 },
      ],
    },
    {
      sender: "bot",
      text: "What kind of support do you need?",
      answer: "You can reach out to our support team via email or WhatsApp for technical assistance.",
      options: [
        { label: "Email Us", nextStep: 5 },
        { label: "WhatsApp", nextStep: 6 },
      ],
    },
    {
      sender: "bot",
      text: "Would you like to request a call with our sales team?",
      options: [
        { label: "Request a Call", nextStep: 7 },
        { label: "Send Email", nextStep: 5 },
      ],
    },
    {
      sender: "bot",
      answer: "Please visit our pricing page to explore detailed plan features and pricing.",
      options: [{ label: "Back to Menu", nextStep: 0 }],
    },
    {
      sender: "bot",
      answer: "You can email us at sujalshaha974@gmail.com. We usually respond within 24 hours.",
      options: [{ label: "Back to Menu", nextStep: 0 }],
    },
    {
      sender: "bot",
      answer: "Click below to open WhatsApp and send us your query directly.",
      options: [
        {
          label: "Open WhatsApp",
          action: () => window.open(`https://wa.me/${yourPhoneNumber}`, "_blank"),
        },
        { label: "Back to Menu", nextStep: 0 },
      ],
    },
    {
      sender: "bot",
      answer: "Great! Click below to request a call. Your phone should dial automatically.",
      options: [
        {
          label: "Call Now",
          action: () => (window.location.href = "tel:+919960650886"),
        },
        { label: "Back to Menu", nextStep: 0 },
      ],
    },
  ];

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  // Initialize chat history
  useEffect(() => {
    if (showChatbot && chatHistory.length === 0) {
      resetChat();
    }
  }, [showChatbot]);

  const resetChat = () => {
    setChatHistory([chatSteps[0]]);
    setCurrentStep(0);
  };

  const closeAndResetChatbot = () => {
    setShowChatbot(false);
    setTimeout(() => {
      resetChat();
    }, 300);
  };

  const handleOptionClick = (option) => {
    const newMessage = {
      sender: "user",
      text: option.label,
    };
    setChatHistory((prev) => [...prev, newMessage]);

    if (option.nextStep !== undefined) {
      setIsTyping(true);
      setTimeout(() => {
        const botReply = {
          sender: "bot",
          text: chatSteps[option.nextStep]?.text || "",
          answer: chatSteps[option.nextStep]?.answer || "",
          options: chatSteps[option.nextStep]?.options || [],
        };
        setChatHistory((prev) => [...prev, botReply]);
        setCurrentStep(option.nextStep);
        setIsTyping(false);
      }, 800);
    }

    if (option.action) {
      option.action();
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Thanks!",
            answer: "Would you like to go back to the main menu?",
            options: [{ label: "Back to Menu", nextStep: 0 }],
          },
        ]);
      }, 500);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    const message = `📋 *New Business Inquiry* 📋

*Contact Details:*
▫️ *Name:* ${formData.name.trim()}
▫️ *Email:* ${formData.email.trim()}
${formData.company.trim() ? `▫️ *Company:* ${formData.company.trim()}\n` : ''}
📅 *Submitted on:* ${new Date().toLocaleString('en-IN', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}

📝 *Message:*
${formData.message.trim() || 'No additional message provided'}

We should schedule a call to discuss this further. Please suggest your availability.

Best regards,
${formData.name.trim()}`;

    const whatsappUrl = `https://wa.me/${yourPhoneNumber}?text=${encodeURIComponent(message)}`;
    
    const newWindow = window.open(whatsappUrl, '_blank');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }

    setIsSubmitted(true);
    setIsLoading(false);
    
    setTimeout(() => {
      setShowContactInfo(false);
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        company: "",
        message: "",
      });
    }, 3000);
  };

  const sendWhatsAppMessage = () => {
    if (!selectedDate || !selectedTime) return;

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `Dear Sales Team,

I would like to schedule a call to discuss your services. Below are my details:

Name: ${scheduleFormData.name}
Email: ${scheduleFormData.email}
Phone: ${scheduleFormData.phone}
Company: ${scheduleFormData.company || 'Not specified'}

Preferred Call Time:
Date: ${formattedDate}
Time: ${selectedTime} (IST)

Discussion Topics:
${scheduleFormData.agenda || 'General inquiry about your services and pricing plans'}

Please confirm this appointment or suggest an alternative time if needed.

I look forward to speaking with you.

Best regards,
${scheduleFormData.name}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${yourPhoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const sendSMS = () => {
    if (!selectedDate || !selectedTime) return;

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `New Call Request:
Name: ${scheduleFormData.name}
Email: ${scheduleFormData.email}
Phone: ${scheduleFormData.phone}
Company: ${scheduleFormData.company || 'Not provided'}
Date: ${formattedDate}
Time: ${selectedTime}
Agenda: ${scheduleFormData.agenda || 'General discussion'}`;

    window.open(`sms:${yourPhoneNumber}?body=${encodeURIComponent(message)}`);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setScheduleError('Please select both date and time for your call');
      return;
    }

    if (!scheduleFormData.name || !scheduleFormData.phone) {
      setScheduleError('Please fill all required fields');
      return;
    }

    setIsScheduleLoading(true);
    setScheduleError(null);

    try {
      setIsScheduleSubmitted(true);
    } catch (err) {
      console.error('Failed to schedule call:', err);
      setScheduleError('Failed to schedule call. Please try again later.');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  useEffect(() => {
    const loadCalendlyScript = () => {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadCalendlyScript();
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Flexible Credit Plans
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-xl leading-relaxed">
          Discover scalable credit options tailored to your creative needs. From starter to enterprise solutions, we've got you covered.
        </p>
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap justify-center gap-8 text-left max-w-6xl"
      >
        {plans.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="w-full sm:w-[300px] bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">{item.id} Plan</h3>
                {item.id === "Pro" && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 p-3 rounded-full">
                  <img src={assets.logo_icon} alt="Plan Icon" className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-indigo-600 font-semibold">{item.credits} Credits</p>
                </div>
              </div>

              <p className="text-gray-600 min-h-[60px]">{item.desc}</p>

              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-gray-800">₹{item.price}</span>
                <span className="text-gray-500">/ {item.credits} credits</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${
                  item.id === "Pro" 
                    ? "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600" 
                    : "bg-gray-800 hover:bg-gray-900"
                }`}
              >
                {user ? "Purchase Now" : "Get Started"}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Contact Sales Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-center"
      >
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 max-w-3xl mx-4">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Need Enterprise Solutions?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            For organizations requiring custom plans, volume discounts, or dedicated support, our sales team can craft a solution tailored to your needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowContactInfo(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Contact Sales Team
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowScheduleModal(true)}
              className="bg-white text-gray-800 px-8 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Schedule a Call
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => {
          setShowChatbot(!showChatbot);
          if (!showChatbot) resetChat();
        }}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <MessageSquare size={28} />
      </button>

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">Live Chat</h3>
            <button onClick={closeAndResetChatbot} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="p-3 h-64 md:h-80 overflow-y-auto bg-gray-50 space-y-3">
            <AnimatePresence>
              {chatHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.sender === "user" ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`max-w-xs ${
                    msg.sender === "user"
                      ? "ml-auto bg-indigo-600 text-white rounded-2xl p-3"
                      : "bg-white border border-gray-200 rounded-2xl p-3"
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.answer && <p className="mt-2 text-sm text-gray-600">{msg.answer}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="bg-white border border-gray-200 rounded-2xl p-3">
                <TypingIndicator />
              </div>
            )}
          </div>

          {/* Options Area */}
          <div className="p-2 bg-white border-t border-gray-200">
            <div className="grid grid-cols-1 gap-2">
              {chatSteps[currentStep]?.options?.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionClick(option)}
                  className="bg-indigo-100 text-indigo-800 py-2 px-4 rounded-md hover:bg-indigo-200 text-sm font-medium transition-colors text-left"
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="relative">
                <button 
                  onClick={() => setShowContactInfo(false)}
                  className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-white transition-all shadow-sm"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>

                <div className="grid md:grid-cols-2">
                  {/* Contact Form */}
                  <div className="p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Contact Our Sales Team</h2>
                    <p className="text-gray-600 mb-6">Fill out the form and we'll get back to you within 24 hours.</p>
                    
                    {isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg text-center"
                      >
                        <div className="flex justify-center mb-4">
                          <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <p className="font-medium text-lg mb-1">Message sent successfully!</p>
                        <p className="text-sm">We've opened WhatsApp for you to continue the conversation.</p>
                        <p className="text-xs mt-3 text-green-600">
                          If WhatsApp didn't open, please check your pop-up settings.
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Your Name"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="you@company.com"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="company" className="text-sm font-medium text-gray-700">Company (Optional)</label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Your Company"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="message" className="text-sm font-medium text-gray-700">Your Requirements *</label>
                          <div className="relative">
                            <div className="absolute top-3 left-3">
                              <MessageSquare className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                              id="message"
                              name="message"
                              value={formData.message}
                              onChange={handleInputChange}
                              required
                              rows={4}
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Tell us about your project and requirements..."
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: isLoading ? 1 : 1.02 }}
                          whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          type="submit"
                          disabled={isLoading}
                          className={`w-full ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={18} />
                              Submit Inquiry
                            </>
                          )}
                        </motion.button>
                      </form>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-8 md:p-10 text-white">
                    <div className="h-full flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-6">How can we help you?</h3>
                        <p className="mb-8 opacity-90">
                          Our sales specialists are ready to discuss custom plans, volume discounts, and enterprise solutions tailored to your organization's needs.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Call Us</h4>
                            <p className="opacity-90 text-sm">+91 7517053282</p>
                            <p className="opacity-90 text-sm">Mon-Fri, 9am-5pm IST</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Email Us</h4>
                            <p className="opacity-90 text-sm">sujalshaha974@gmail.com</p>
                            <p className="opacity-90 text-sm">Typically respond within 24 hours</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Our Location</h4>
                            <p className="opacity-90 text-sm">Ashta , India</p>
                            <p className="opacity-90 text-sm">Remote team across multiple timezones</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Call Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleFormData({
                      name: "",
                      email: "",
                      company: "",
                      phone: "",
                      agenda: "",
                    });
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setIsScheduleSubmitted(false);
                  }}
                  className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-white transition-all shadow-sm"
                  disabled={isScheduleLoading}
                >
                  <X size={20} />
                </button>

                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Schedule a Call</h2>
                  <p className="text-gray-600 mb-6">Book a time that works for you and we'll call you at the scheduled time.</p>
                  
                  {isScheduleSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 text-green-700 p-4 rounded-lg text-center"
                    >
                      <p className="font-medium">Your call has been scheduled!</p>
                      <p className="mb-4">
                        {scheduleFormData.name}, we'll call you at {selectedTime} on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={sendWhatsAppMessage}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={18} />
                          Continue on WhatsApp
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={sendSMS}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone size={16} />
                          Send via SMS
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowScheduleModal(false)}
                          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all"
                        >
                          Close
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleScheduleSubmit} className="space-y-6">
                      {scheduleError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                          {scheduleError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label htmlFor="schedule-name" className="text-sm font-medium text-gray-700">Full Name *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              id="schedule-name"
                              name="name"
                              value={scheduleFormData.name}
                              onChange={handleScheduleInputChange}
                              required
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Your Name"
                              disabled={isScheduleLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="schedule-email" className="text-sm font-medium text-gray-700">Email Address *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              id="schedule-email"
                              name="email"
                              value={scheduleFormData.email}
                              onChange={handleScheduleInputChange}
                              required
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="you@company.com"
                              disabled={isScheduleLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="schedule-company" className="text-sm font-medium text-gray-700">Company (Optional)</label>
                          <input
                            type="text"
                            id="schedule-company"
                            name="company"
                            value={scheduleFormData.company}
                            onChange={handleScheduleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Your Company"
                            disabled={isScheduleLoading}
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="schedule-phone" className="text-sm font-medium text-gray-700">Phone Number *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              id="schedule-phone"
                              name="phone"
                              value={scheduleFormData.phone}
                              onChange={handleScheduleInputChange}
                              required
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="+91 1234567890"
                              disabled={isScheduleLoading}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="schedule-agenda" className="text-sm font-medium text-gray-700">Agenda (Optional)</label>
                        <textarea
                          id="schedule-agenda"
                          name="agenda"
                          value={scheduleFormData.agenda}
                          onChange={handleScheduleInputChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="What would you like to discuss?"
                          disabled={isScheduleLoading}
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-800">Select Date and Time</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                          {availableDates.map((date, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedDate(date)}
                              className={`p-2 rounded-lg border text-center text-sm ${
                                selectedDate && date.toDateString() === selectedDate.toDateString()
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="font-medium">
                                {date.toLocaleDateString('en-US', { day: 'numeric' })}
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedDate && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {availableTimes.map((time, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`p-2 rounded-lg border text-center text-sm ${
                                  selectedTime === time
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: isScheduleLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isScheduleLoading ? 1 : 0.98 }}
                        type="submit"
                        disabled={isScheduleLoading || !selectedDate || !selectedTime || !scheduleFormData.name || !scheduleFormData.phone}
                        className={`w-full ${
                          isScheduleLoading || !selectedDate || !selectedTime || !scheduleFormData.name || !scheduleFormData.phone
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
                      >
                        {isScheduleLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <Calendar size={18} />
                            Schedule Call
                          </>
                        )}
                      </motion.button>

                      <div className="text-center text-sm text-gray-500">
                       
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                          onClick={() => {
                            window.Calendly.initPopupWidget({
                              url: 'https://calendly.com/your-username'
                            });
                            return false;
                          }}
                        >
                          
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex space-x-1 items-center">
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
  </div>
);

export default BuyCredit;

