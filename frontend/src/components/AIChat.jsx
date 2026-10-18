import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { trackChatOpen, trackChatMessage, trackSearchQuery, trackFormSubmit } from "../utils/analytics";
import {
  detectIndustry,
  getRecommendations,
  trackCTAInterest,
  trackSearchHistory,
  trackServiceInterest,
} from "../utils/visitor";

const CHAT_HISTORY_KEY = "chromolog_ai_chat_history";
const CHAT_SESSION_KEY = "chromolog_ai_chat_session";
const LEAD_CAPTURED_KEY = "chromolog_lead_captured";
// The Claude-powered sales agent is off until an API key is configured; the free
// offline knowledge base answers instead. Set VITE_AI_CHAT_ENABLED=true to switch.
const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED === "true";
const AI_CHAT_URL = import.meta.env.VITE_AI_CHAT_URL || "/api/ai/chat.php";
const LEAD_URL = import.meta.env.VITE_LEAD_URL || "/api/ai/lead.php";
// Free-consultation booking page (e.g. Cal.com). Shown after a lead is captured when set.
const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || "";
const BUYING_INTENT = /(price|pricing|cost|quote|budget|how much|contact|hire|start|consult|call|meeting|demo|proposal|estimate)/i;

function newSessionId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getSessionId() {
  try {
    let id = localStorage.getItem(CHAT_SESSION_KEY);
    if (!id) {
      id = newSessionId();
      localStorage.setItem(CHAT_SESSION_KEY, id);
    }
    return id;
  } catch {
    return newSessionId();
  }
}

// Ask the AI Sales Agent (growth-api). Throws on network/server failure so the caller
// can fall back to the offline knowledge base below.
async function askSalesAgent(message) {
  const res = await fetch(AI_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: getSessionId(), message, page: window.location.pathname }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.reply) return { text: data.reply, cards: [] };
  if (data.error && res.status !== 500) return { text: data.error, cards: [] };
  throw new Error(`AI chat failed: ${res.status}`);
}

async function submitLead(fields) {
  const res = await fetch(LEAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fields, source: "website_chat", session_id: getSessionId() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send your details.");
}

function hasCapturedLead() {
  try {
    return localStorage.getItem(LEAD_CAPTURED_KEY) === "1";
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Inline lead form (free lead capture)
// ─────────────────────────────────────────────
function LeadForm({ summary, onDone, onDismiss }) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", service_interest: "", website: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const field = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-muted-text/50 focus:outline-none focus:border-accent/40 font-body";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setError("Please enter your name.");
    if (!form.phone.trim() && !form.email.trim()) return setError("Please add a WhatsApp number or email.");
    setSending(true);
    setError("");
    try {
      await submitLead({ ...form, summary });
      trackFormSubmit("ai_chat", form.service_interest.trim() || "unspecified");
      trackCTAInterest("AI chat lead form submitted");
      onDone(form.full_name.trim());
    } catch (err) {
      setError(`${err.message} You can also WhatsApp us at +91 94002 30723.`);
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/15 bg-accent/5 p-3 space-y-2">
      <p className="text-xs font-heading font-bold text-white">Get a free consultation</p>
      <p className="text-[11px] text-muted-text leading-relaxed">Share your details and our team will reach out within one business day.</p>
      <input className={field} placeholder="Your name *" value={form.full_name} onChange={set("full_name")} maxLength={120} autoComplete="name" />
      <input className={field} placeholder="WhatsApp / phone" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" inputMode="tel" />
      <input className={field} placeholder="Email" type="email" value={form.email} onChange={set("email")} maxLength={160} autoComplete="email" />
      <input className={field} placeholder="What would you like to build?" value={form.service_interest} onChange={set("service_interest")} maxLength={200} />
      <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p className="text-[11px] text-red-300">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={sending} className="flex-1 rounded-lg bg-gradient-to-br from-primary to-accent text-white text-xs font-bold py-2 disabled:opacity-50">
          {sending ? "Sending..." : "Request callback"}
        </button>
        <button type="button" onClick={onDismiss} className="rounded-lg border border-white/[0.08] text-muted-text text-xs px-3 hover:text-white">
          Not now
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Knowledge Base — pattern-matched responses
// ─────────────────────────────────────────────
const KB = [
  {
    patterns: ["who are you", "what is chromolog", "about", "company", "what do you do"],
    response: `**Chromolog Technologies** is a premium AI-first software development company based in Kerala, India.\n\nWe build intelligent web apps, mobile apps, enterprise ERPs, HRMS systems, AI automation pipelines, and custom SaaS platforms for clients across 12+ industries globally.`,
  },
  {
    patterns: ["services", "what can you build", "what do you offer", "capabilities"],
    response: `We offer end-to-end software engineering:\n\n→ **AI & Automation** — Autonomous agents, RAG pipelines, LLM integrations\n→ **Web Development** — React, Next.js, Laravel, Node.js\n→ **Mobile Apps** — Flutter (iOS + Android, offline-first)\n→ **Enterprise ERP/HRMS** — Multi-tenant, role-based custom platforms\n→ **Cloud & DevOps** — AWS, Docker, CI/CD pipelines`,
  },
  {
    patterns: ["ai", "artificial intelligence", "machine learning", "llm", "gpt", "agents", "automation"],
    response: `Our AI capabilities include:\n\n→ **Autonomous AI Agents** — hands-off document processing\n→ **RAG Search Pipelines** — semantic knowledge retrieval\n→ **Predictive Analytics** — ML scoring and forecasting\n→ **Document Intelligence (OCR)** — invoice and form parsing\n→ **LLM Fine-tuning** — OpenAI, Gemini, Claude APIs\n\nWe integrate AI directly into your ERP, HRMS, or SaaS core — not as an afterthought.`,
  },
  {
    patterns: ["products", "portfolio", "case studies", "projects", "work", "built"],
    response: `Key products we've shipped:\n\n→ **AlphaGrew Smart Campus ERP** — University placement & admissions\n→ **HumaNode HRMS** — Enterprise HR, payroll & attendance\n→ **Medical College Chest Hospital App** — Patient token system\n→ **Restaurant QR Ordering Platform** — Kitchen display + billing\n→ **Retail Billing & Inventory** — Multi-store POS\n→ **YCDC Enterprise Transformation** — Business automation suite\n\nTap **"View Projects"** to see full case studies.`,
  },
  {
    patterns: ["healthcare", "hospital", "clinic", "patient", "medical"],
    response: `For healthcare, we build:\n\n→ **Patient Token Systems** — real-time queue displays\n→ **Offline-first clinic apps** — Flutter with SQLite sync\n→ **Biometric attendance** — staff management\n→ **Encrypted medical records** — HIPAA-ready architecture\n\nOur flagship healthcare product is the **Medical College Chest Hospital Token System** — deployed across 3 wards.`,
  },
  {
    patterns: ["education", "university", "campus", "students", "erp", "placement"],
    response: `For education, we build:\n\n→ **Smart Campus ERPs** — admissions, fees, placement\n→ **AI Resume Analyzers** — placement scoring\n→ **Library E-Gate Systems** — RFID integration\n→ **Multi-persona dashboards** — student, faculty, admin views\n\nOur **AlphaGrew Platform** handles 10,000+ student profiles and 8,500+ placement applications per semester.`,
  },
  {
    patterns: ["tech stack", "technology", "framework", "react", "flutter", "laravel", "next", "node"],
    response: `Our primary tech stack:\n\n**Frontend** — React 19, Next.js 15, Tailwind CSS\n**Mobile** — Flutter (Dart), offline-first architecture\n**Backend** — Laravel, Node.js, Express\n**AI/ML** — Python, OpenAI GPT-4, Claude, Gemini\n**Database** — PostgreSQL, MySQL, Firebase, Redis\n**Cloud** — AWS (Lightsail, ECS, S3), Docker, CI/CD`,
  },
  {
    patterns: ["price", "pricing", "cost", "how much", "budget", "quote"],
    response: `Pricing at Chromolog is **project-scoped** — we don't use generic packages because every build is custom.\n\nFactors that shape cost:\n→ Project scope and module count\n→ AI integrations required\n→ Mobile vs web vs both\n→ Timeline and support needs\n\n📩 **Contact us for a free scoping session** — we'll give you a precise estimate within 24 hours.`,
  },
  {
    patterns: ["process", "how do you work", "development process", "workflow", "pipeline", "steps"],
    response: `Our 8-step delivery pipeline:\n\n1. **Discovery** — deep operational analysis\n2. **Research & Plan** — system design\n3. **UI/UX Design** — high-fidelity prototypes\n4. **Core Development** — modular APIs\n5. **AI Integration** — agents & LLMs\n6. **Rigorous Testing** — security + QA\n7. **CI/CD Deployment** — zero-downtime launch\n8. **Dedicated Support** — monitoring & scaling`,
  },
  {
    patterns: ["contact", "reach", "email", "phone", "call", "whatsapp", "get in touch"],
    response: `Reach Chromolog Technologies:\n\n📧 **Email** — [info@chromologtechnologies.com](mailto:info@chromologtechnologies.com)\n📱 **WhatsApp** — +91 94002 30723\n🌐 **Website** — chromologtechnologies.com\n\nOr scroll to the **Contact** section at the bottom of this page — we respond within 24 hours.`,
  },
  {
    patterns: ["location", "where", "india", "kerala", "based", "office"],
    response: `Chromolog Technologies is headquartered in **Kerala, India** 🇮🇳\n\nWe serve clients globally — from Kerala-based businesses to international startups — delivering fully remote, timezone-aware software development engagements.`,
  },
  {
    patterns: ["timeline", "how long", "duration", "weeks", "months", "deadline"],
    response: `Typical project timelines:\n\n→ **Simple web app** — 3–6 weeks\n→ **Mobile app (Flutter)** — 6–10 weeks\n→ **Enterprise ERP/HRMS** — 3–6 months\n→ **AI integration module** — 2–4 weeks (add-on)\n\nTimelines depend on scope, complexity, and required integrations. We share a milestone roadmap after scoping.`,
  },
  {
    patterns: ["industries", "sectors", "verticals", "domains"],
    response: `We've shipped products across **12 industries**:\n\n→ Healthcare & Clinics\n→ Education & Universities\n→ Retail & Inventory\n→ Restaurant & Hospitality\n→ HR & Enterprise\n→ Logistics & Supply Chain\n→ Gym & Fitness\n→ AI SaaS Startups\n→ Real Estate\n→ Finance & Accounting\n→ Manufacturing\n→ Government`,
  },
  {
    patterns: ["blog", "articles", "knowledge hub", "insights", "reads"],
    response: `Our **Knowledge Hub** features deep technical articles on:\n\n→ AI Agent workflows in ERPs\n→ Laravel 12 vs Node.js API comparison\n→ Multi-tenant PostgreSQL architecture\n→ Offline-first Flutter app design\n→ AWS Lightsail vs ECS deployment\n→ Chromolog V3 launch announcement\n\nTap **"Knowledge Hub"** in the navigation to read them.`,
  },
  {
    patterns: ["hello", "hi", "hey", "good morning", "good evening", "help"],
    response: `Hello! 👋 I'm the **Chromolog AI Assistant**.\n\nI can help you with:\n→ Learning about our services\n→ Understanding our products & case studies\n→ Exploring our technology stack\n→ Getting pricing guidance\n→ Connecting with our team\n\nWhat would you like to know?`,
  },
];

const RICH_CARD_MAP = {
  healthcare: [
    { title: "Healthcare App Architecture", text: "Patient queues, staff workflows, offline-first Flutter clients, secure records, and analytics." },
    { title: "Recommended Next Step", text: "Map patient flow, integrations, and deployment constraints in a scoping call." },
  ],
  education: [
    { title: "Education ERP Blueprint", text: "Admissions, placements, fees, faculty dashboards, AI resume scoring, and parent/student portals." },
    { title: "Featured Product", text: "AlphaGrew Smart Campus ERP for high-volume campus operations." },
  ],
  retail: [
    { title: "Retail POS Stack", text: "Fast billing, inventory sync, barcode workflows, GST-ready reports, and branch dashboards." },
    { title: "AI Opportunity", text: "Demand forecasting, reorder suggestions, and sales anomaly detection." },
  ],
  enterprise: [
    { title: "Enterprise Automation", text: "RBAC, approval flows, HRMS, payroll, CRM, Redis queues, and analytics dashboards." },
    { title: "AI Integration", text: "Document intelligence, copilots, and workflow agents connected to your operational data." },
  ],
  ai: [
    { title: "AI Integration Options", text: "OpenAI, Gemini, Claude, RAG search, agentic workflows, OCR, and predictive scoring." },
    { title: "Architecture Pattern", text: "Provider registry, guarded prompts, vector-ready knowledge base, Redis cache, and audit logs." },
  ],
};

function classifyQuery(query) {
  const q = query.toLowerCase();
  if (/(health|hospital|clinic|patient|medical)/.test(q)) return "healthcare";
  if (/(educ|college|campus|student|placement|school|university)/.test(q)) return "education";
  if (/(retail|pos|inventory|billing|store)/.test(q)) return "retail";
  if (/(enterprise|hr|hrms|payroll|workflow|crm)/.test(q)) return "enterprise";
  if (/(ai|agent|automation|llm|rag|openai|gemini|claude|ocr)/.test(q)) return "ai";
  return detectIndustry() || "ai";
}

function getResponse(query) {
  const q = query.toLowerCase().trim();
  for (const entry of KB) {
    if (entry.patterns.some((p) => q.includes(p))) {
      return {
        text: entry.response,
        cards: RICH_CARD_MAP[classifyQuery(query)] || [],
      };
    }
  }
  const recs = getRecommendations();
  return {
    text: `I can help scope that. Based on your current interests, the best next path is likely **${recs[0]?.title || "AI-powered software architecture"}**.\n\nA practical discovery flow would cover:\n\n→ Business workflow and users\n→ Required integrations\n→ AI capabilities and data sources\n→ Timeline, risk, and launch plan\n\nShare your industry and goal, and I can suggest a more precise architecture.`,
    cards: recs.map((rec) => ({ title: rec.title, text: rec.reason })),
  };
}

// ─────────────────────────────────────────────
// Markdown renderer (bold, arrows, bullets)
// ─────────────────────────────────────────────
function MarkdownText({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm leading-relaxed font-body">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Suggested quick questions
// ─────────────────────────────────────────────
const SUGGESTIONS = [
  "What services do you offer?",
  "Show me your products",
  "What's your tech stack?",
  "How does your process work?",
  "How can I contact you?",
  "What does it cost?",
];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AIChat({ setActivePage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore corrupted chat history.
    }
    return [
      {
        role: "assistant",
        text: "Hello! I'm the **Chromolog AI Assistant**.\n\nAsk me anything about our services, products, pricing, architecture, or tech stack. I can also recommend the right solution path.",
        id: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [streamingText, setStreamingText] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(hasCapturedLead);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamingText]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-16)));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    trackChatOpen();
  };

  const sendMessage = (query = input.trim()) => {
    if (!query) return;
    const userMsg = { role: "user", text: query, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);
    setStreamingText("");
    trackChatMessage(query);
    trackSearchQuery(query);
    trackSearchHistory(query);
    if (/ai|automation|agent|llm|rag|ocr/i.test(query)) trackServiceInterest("AI & Automation");
    if (/web|saas|portal|dashboard/i.test(query)) trackServiceInterest("Web Application Development");
    if (/mobile|flutter|ios|android/i.test(query)) trackServiceInterest("Mobile App Development");

    const userTurns = messages.filter((m) => m.role === "user").length + 1;
    const wantsLeadForm = !AI_CHAT_ENABLED && !leadCaptured && (BUYING_INTENT.test(query) || userTurns === 3);
    const getReply = AI_CHAT_ENABLED
      ? askSalesAgent(query).catch(() => getResponse(query))
      : new Promise((resolve) => setTimeout(() => resolve(getResponse(query)), 450));

    getReply.then((reply) => {
      const chunks = reply.text.match(/.{1,42}(\s|$)/g) || [reply.text];
      let index = 0;
      const streamId = window.setInterval(() => {
        index += 1;
        setStreamingText(chunks.slice(0, index).join(""));
        if (index >= chunks.length) {
          window.clearInterval(streamId);
          setIsTyping(false);
          setStreamingText("");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: reply.text, cards: reply.cards, id: Date.now() },
          ]);
          if (wantsLeadForm) setShowLeadForm(true);
        }
      }, 20);
    });
  };

  const handleLeadDone = (name) => {
    setShowLeadForm(false);
    setLeadCaptured(true);
    try {
      localStorage.setItem(LEAD_CAPTURED_KEY, "1");
    } catch {
      // Storage may be unavailable in private browsing.
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: BOOKING_URL
          ? `Thank you, **${name}**! Our team will reach out within one business day.\n\nWant to pick a time right away? Book your free consultation below, or WhatsApp **+91 94002 30723**.`
          : `Thank you, **${name}**! Our team will reach out within one business day.\n\nNeed us sooner? WhatsApp **+91 94002 30723**.`,
        link: BOOKING_URL ? { href: BOOKING_URL, label: "Book a free consultation" } : null,
        id: Date.now(),
      },
    ]);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hello! 👋 I'm the **Chromolog AI Assistant**.\n\nAsk me anything about our services, products, pricing, or tech stack — I'm here to help.",
        id: Date.now(),
      },
    ]);
    setShowSuggestions(true);
    setShowLeadForm(false);
    setInput("");
    setStreamingText("");
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.removeItem(CHAT_SESSION_KEY);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  };

  return (
    <>
      {/* Floating Trigger Bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 2 }}
            onClick={handleOpen}
            className="fixed bottom-24 right-6 z-[120] w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 hidden md:flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
            aria-label="Open AI Assistant"
          >
            <MessageSquare className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-[120] w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]"
            style={{ height: "min(580px, calc(100vh - 9rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0A0F1D] to-[#080C18] border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-heading font-extrabold text-white leading-none">AI Assistant</p>
                  <p className="text-[10px] text-accent/80 font-body mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                    Chromolog Knowledge Base
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-text hover:text-white transition-colors"
                  title="Reset conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-text hover:text-white transition-colors"
                  aria-label="Close AI Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#060A16] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white/[0.04] border border-white/[0.06] text-muted-text rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <MarkdownText text={msg.text} />
                        {msg.link && (
                          <a
                            href={msg.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackCTAInterest("AI chat booking link")}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-primary to-accent text-white text-xs font-bold px-3 py-2 hover:opacity-90"
                          >
                            <ArrowRight className="w-3 h-3" /> {msg.link.label}
                          </a>
                        )}
                        {msg.cards?.length > 0 && (
                          <div className="grid gap-2 mt-3">
                            {msg.cards.map((card) => (
                              <button
                                key={card.title}
                                type="button"
                                onClick={() => {
                                  trackCTAInterest(`AI card: ${card.title}`);
                                  setInput(card.title);
                                }}
                                className="text-left rounded-xl border border-accent/10 bg-accent/5 hover:bg-accent/10 px-3 py-2 transition-colors"
                              >
                                <span className="block text-xs font-heading font-bold text-white">{card.title}</span>
                                <span className="block text-[11px] leading-relaxed text-muted-text mt-1">{card.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-body">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-4 min-w-[82px]">
                    {streamingText ? (
                      <MarkdownText text={streamingText} />
                    ) : (
                      <div className="flex gap-1.5 items-center">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Suggested questions */}
              {showSuggestions && !isTyping && messages.length === 1 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold text-muted-text/60 uppercase tracking-widest font-heading px-1">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-[11px] font-semibold text-accent/80 border border-accent/15 bg-accent/5 hover:bg-accent/10 hover:text-accent px-3 py-1.5 rounded-xl transition-all font-body"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lead capture */}
              {showLeadForm && !isTyping && (
                <LeadForm
                  summary={messages.filter((m) => m.role === "user").slice(-5).map((m) => m.text).join(" | ")}
                  onDone={handleLeadDone}
                  onDismiss={() => setShowLeadForm(false)}
                />
              )}

              {/* Quick actions after conversation starts */}
              {messages.length > 2 && !isTyping && !showLeadForm && (
                <div className="flex gap-2 pt-1 flex-wrap">
                  {!leadCaptured && (
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-accent border border-accent/20 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-xl transition-all font-heading"
                    >
                      <ArrowRight className="w-3 h-3" /> Free consultation
                    </button>
                  )}
                  <button
                    onClick={() => setActivePage && setActivePage("home")}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text/70 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:text-white px-3 py-1.5 rounded-xl transition-all font-heading"
                  >
                    <ArrowRight className="w-3 h-3" /> View Projects
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "contact" } })), 200);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text/70 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:text-white px-3 py-1.5 rounded-xl transition-all font-heading"
                  >
                    <ArrowRight className="w-3 h-3" /> Contact Us
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 bg-[#060A16] border-t border-white/[0.06] shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about Chromolog..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted-text/50 focus:outline-none focus:border-accent/40 transition-colors font-body"
                  disabled={isTyping}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[9px] text-muted-text/30 text-center mt-2 font-body">
                Powered by Chromolog Knowledge Base
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
