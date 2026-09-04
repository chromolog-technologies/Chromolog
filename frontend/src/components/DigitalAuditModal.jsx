// ─── Digital Efficiency Audit Interactive Tool Modal ─────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ChevronRight, ChevronLeft, PhoneCall } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function DigitalAuditModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    businessType: "",
    employees: "",
    usesExcel: "",
    usesWhatsApp: "",
    hasCrmErp: "",
    biggestProblem: "",
    hasWebsite: "",
    goal: "",
    name: "",
    phone: "",
    email: "",
    company: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      id: "businessType",
      title: "1. What type of business do you operate?",
      subtitle: "Select your primary commercial domain.",
      options: ["Retail & Wholesale", "Healthcare & Clinics", "Education & Academies", "Real Estate & Construction", "Manufacturing & Trading", "Corporate & Professional Services"],
    },
    {
      id: "employees",
      title: "2. How many employees are in your organization?",
      subtitle: "Helps us assess shift, HR, and workflow scale.",
      options: ["1 – 10 Employees", "11 – 50 Employees", "51 – 200 Employees", "200+ Employees"],
    },
    {
      id: "usesExcel",
      title: "3. Do you currently rely on Excel for operations?",
      subtitle: "Spreadsheet inventory, billing, or client lists.",
      options: ["Yes, heavily dependent on Excel", "Partially use spreadsheets", "No, we use software"],
    },
    {
      id: "usesWhatsApp",
      title: "4. Do you use WhatsApp for customer or order management?",
      subtitle: "Managing orders, enquiries, and client chats.",
      options: ["Yes, daily order chaos in WhatsApp", "Occasionally for customer chats", "No, official portal only"],
    },
    {
      id: "hasCrmErp",
      title: "5. Do you currently have a CRM or ERP software system?",
      subtitle: "Centralized client or operational database.",
      options: ["No, zero custom CRM/ERP", "Yes, but disconnected SaaS apps", "Outdated legacy system"],
    },
    {
      id: "biggestProblem",
      title: "6. What is your biggest operational problem today?",
      subtitle: "Select your primary pain point.",
      options: ["Manual data re-entry & spreadsheets", "Lost leads & WhatsApp order confusion", "Outdated website that yields 0 leads", "Disconnected departments & stock errors"],
    },
    {
      id: "hasWebsite",
      title: "7. Do you have an existing company website?",
      subtitle: "Assessing visual & speed health.",
      options: ["Yes, but 3+ years old and slow", "Yes, modern website", "No website currently"],
    },
    {
      id: "goal",
      title: "8. What are you looking to improve most right now?",
      subtitle: "Select your top commercial objective.",
      options: ["Automate manual business operations", "Upgrade website & generate more leads", "Build custom CRM / HRMS / ERP", "Develop a custom Web/Mobile App"],
    },
  ];

  const handleSelectOption = (key, value) => {
    setAnswers({ ...answers, [key]: value });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(questions.length);
    }
  };

  const handleFormChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setStep(0);
    setSubmitted(false);
    onClose();
  };

  const currentQ = questions[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl rounded-3xl bg-bg-dark border border-white/15 p-6 md:p-8 shadow-2xl overflow-hidden text-white"
        >
          {/* Close Button */}
          <button
            onClick={handleReset}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.04] text-muted-text hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold font-heading text-white">Digital Audit Submitted!</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{answers.name}</strong>. Based on your answers, our senior software architect will generate a 1-page efficiency roadmap and call/WhatsApp you within 4 hours.
              </p>
              <div className="pt-3 flex justify-center gap-3">
                <a
                  href={`https://wa.me/919400230723?text=Hi%2C%20I%20just%20completed%20the%20Digital%20Efficiency%20Audit%20for%20${encodeURIComponent(answers.businessType || "our business")}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold font-heading hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" /> Message Us on WhatsApp
                </a>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Close Window
                </Button>
              </div>
            </div>
          ) : step < questions.length ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-heading">
                  <Badge variant="ai" className="px-2.5 py-0.5 text-[10px]">
                    Free Digital Audit
                  </Badge>
                  <span>Step {step + 1} of 8</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Header */}
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold font-heading text-white">
                  {currentQ.title}
                </h3>
                <p className="text-xs text-slate-300 font-body">{currentQ.subtitle}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className="w-full p-3.5 rounded-xl bg-white/[0.06] border border-white/15 hover:border-cyan-400/40 hover:bg-white/[0.12] text-left text-xs font-semibold text-white font-heading transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{opt}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              {/* Back Button */}
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Question
                </button>
              )}
            </div>
          ) : (
            /* Final Step: Contact Info */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Badge variant="status" color="success" className="px-2.5 py-0.5 text-[10px]">
                  Audit Complete
                </Badge>
                <h3 className="text-lg font-extrabold font-heading text-white">
                  Where should we send your Digital Efficiency Audit?
                </h3>
                <p className="text-xs text-muted-text">
                  Our software engineers will compile your custom automation & ROI recommendations.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your Name *"
                  value={answers.name}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Phone / WhatsApp *"
                    value={answers.phone}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Work Email *"
                    value={answers.email}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                  />
                </div>
                <input
                  type="text"
                  name="company"
                  placeholder="Company / Business Name"
                  value={answers.company}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-muted-text/60 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(questions.length - 1)}
                  className="text-xs text-muted-text hover:text-white"
                >
                  Back to Questions
                </button>
                <Button variant="gradient" size="md" type="submit">
                  Generate My Audit Report
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
