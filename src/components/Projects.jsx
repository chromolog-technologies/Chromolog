import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Sparkles, AlertCircle, BarChart3, Clock, ShieldCheck } from "lucide-react";
import Counter from "./Counter";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const projData = [
  {
    id: 1,
    title: "Medical College Chest Hospital",
    subtitle: "Real-time Patient Token System",
    industry: "Healthcare",
    filters: ["Healthcare"],
    status: "Approved",
    statusKey: "approved",
    description: "Upgrading a legacy medical registry system into a synchronized Laravel and offline-first Flutter queue display ecosystem, reducing wait times and logging patient logs securely.",
    tech: ["Flutter SDK", "Laravel REST API", "MySQL RDS", "Firebase FCM", "WebSockets"],
    modules: ["Patient QR Ticketing", "Real-time Display Queue", "Biometric Doctor Check-in", "SMS Notification Alerts", "Audit logging dashboard"],
    icon: "ri-hospital-line",
    gradient: "linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)",
    objectives: ["Modernize legacy paper ticketing", "Minimize patient crowding", "Provide live queue display interfaces", "Track check-in statistics in real time"],
    challenges: ["Migrating legacy DB with zero clinic downtime", "Handling 5,000+ daily concurrent queue requests", "Real-time synchronization across multiple local smart TVs"],
    solutions: ["Laravel background jobs for transaction queues", "Local cache fallback for low network hours", "Firebase socket triggers for instant queue updates"],
    timeline: "6 Months",
    impact: ["42% Patient wait time reduction", "99.9% Queue uptime maintained", "Zero data discrepancies logged"],
  },
  {
    id: 2,
    title: "YCDC Digital Transformation",
    subtitle: "Enterprise Workflow Automator",
    industry: "Enterprise",
    filters: ["Enterprise"],
    status: "In Development",
    statusKey: "development",
    description: "A centralized approval and departmental document automation platform designed to standardize multi-role corporate flows.",
    tech: ["Laravel PHP", "React.js SPA", "PostgreSQL", "Tailwind CSS", "Redis"],
    modules: ["Dynamic Form Builders", "Approval Chain Engines", "PDF Invoice generation", "Role RBAC managers", "Activity trail monitoring"],
    icon: "ri-building-4-line",
    gradient: "linear-gradient(135deg,#1e1b4b,#4f46e5,#818cf8)",
    objectives: ["Digitize multi-stage approval lists", "Unify company document systems", "Render analytics reports on pipeline speeds", "Enforce strict audit security"],
    challenges: ["Configuring variable approval paths dynamically", "Migrating 8 years of server files", "Maintaining high page response speeds under heavy uploads"],
    solutions: ["Domain-driven repository patterns", "Queue PDF compilation jobs", "Redis database query caching"],
    timeline: "9 Months",
    impact: ["84% Less paper file reliance", "12 hours saved per approval loop", "100% Audit trace coverage"],
  },
  {
    id: 3,
    title: "HumaNode HRMS",
    subtitle: "Multi-Tenant HR Management",
    industry: "HR",
    filters: ["HR"],
    status: "Architecture Completed",
    statusKey: "architecture",
    description: "An enterprise Human Resource Management System engineered with multi-db tenant isolation, automated payroll computations, and biometric schedules.",
    tech: ["Laravel 12", "React SPA", "PostgreSQL DB", "Spatie Permission", "Redis queues"],
    modules: ["Multi-Tenant database isolation", "Hourly Payroll runner", "Leave approval routing", "Biometric REST connector", "Employee profile directories"],
    icon: "ri-team-line",
    gradient: "linear-gradient(135deg,#064e3b,#059669,#34d399)",
    objectives: ["Build scalable tenant routing structure", "Automate complex payroll tax rules", "Connect local biometric scan terminals", "Enforce precise RBAC permissions"],
    challenges: ["Ensuring absolute data separation between companies", "Real-time sync of biometric clock-ins", "Handling massive queued payroll updates concurrently"],
    solutions: ["Tenant database separation connections", "Background cron listeners", "Laravel Horizon queue job workers"],
    timeline: "12 Months",
    impact: ["100% Secure tenant isolation", "Instant payroll calculations", "99.8% Biometric capture reliability"],
  },
  {
    id: 4,
    title: "AlphaGrew Smart Campus ERP",
    subtitle: "Education Management Ecosystem",
    industry: "Education",
    filters: ["Education", "AI"],
    status: "Product Development",
    statusKey: "development",
    description: "A unified EdTech platform organizing admissions, automated fee modules, parent notifications, and an AI-powered student placement helper.",
    tech: ["React.js", "Flutter", "Laravel Framework", "MySQL", "OpenAI API"],
    modules: ["Online Admissions gateway", "Automated Fee Reminders", "AI Resume scoring scanner", "Persona-specific mobile apps", "Academic grading systems"],
    icon: "ri-graduation-cap-line",
    gradient: "linear-gradient(135deg,#172554,#2563eb,#60a5fa)",
    objectives: ["Unify school admin operations", "Automate payment follow-ups", "Empower placements with AI resume parsing", "Support student, faculty, and parent apps"],
    challenges: ["Massive development scope", "Handling payment gateway callbacks reliably", "AI model response latency for CV checks"],
    solutions: ["Strict feature flag scoping", "Laravel callback queue retry systems", "RAG vector retrieval indexing"],
    timeline: "18 Months",
    impact: ["92% Online fee collection rate", "10,000+ Students registered", "85% Placement team workload cut"],
  },
];



function ProjectCard({ project, onOpen }) {
  const tags = project.tech || [];
  return (
    <div
      onClick={() => onOpen(project)}
      className="group relative rounded-2xl border border-white/[0.06] bg-[#0A0F1D]/40 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-500 overflow-hidden cursor-pointer flex flex-col h-full shadow-lg"
    >
      {/* Visual Banner */}
      <div className="h-44 relative overflow-hidden flex items-center justify-center" style={{ background: project.gradient }}>
        <i className={`${project.icon} text-5xl text-white/20 absolute transform transition-transform duration-700 group-hover:scale-110`} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark to-transparent opacity-80" />
        <Badge variant="status" color="primary" className="absolute top-4 right-4 z-10">{project.industry}</Badge>
      </div>

      {/* Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-heading font-extrabold text-white group-hover:text-accent transition-colors duration-300">
            {project.subtitle}
          </h3>
          <span className="text-[10px] text-muted-text uppercase tracking-widest font-heading block">{project.title}</span>
          <p className="text-xs text-muted-text leading-relaxed font-body mt-2">
            {project.description.slice(0, 110)}...
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {tags.slice(0, 3).map((t, idx) => (
            <span key={idx} className="text-[9px] font-semibold text-muted-text border border-white/[0.04] bg-white/[0.01] px-2 py-0.5 rounded font-heading">
              {t}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[9px] font-semibold text-accent border border-accent/15 bg-accent/5 px-2 py-0.5 rounded font-heading">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const filteredProjects = projData.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = activeFilter === "all" || p.filters.includes(activeFilter);
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tech.join(" ").toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  function openCaseStudy(proj) {
    setSelectedProject(proj);
    // Scroll to top of page so case study renders from the top
    window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "projects" } }));
  }

  const handleCloseCaseStudy = () => {
    setSelectedProject(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("chromolog:scrollTo", { detail: { id: "projects" } }));
    }, 100);
  };

  return (
    <section id="projects" className="relative bg-bg-dark overflow-hidden py-16 md:py-24 border-t border-white/[0.05]">
      
      <AnimatePresence mode="wait">
        {!selectedProject ? (
          /* PROJECT GALLERY VIEW */
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-7xl mx-auto px-6 md:px-8 relative z-10"
          >
            {/* Section Head */}
            <div className="section-head reveal text-center max-w-3xl mx-auto mb-16">
              <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">Case Studies</Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
                Real Problems. Digital Solutions.
              </h2>
              <p className="text-muted-text text-base mt-4 max-w-xl mx-auto font-body">
                How Chromolog transforms manual operational friction into measurable enterprise growth.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 border-b border-white/[0.06] pb-12">
              {[
                { end: 12, suffix: "+", label: "Projects Completed" },
                { end: 6, suffix: "+", label: "Industries Served" },
                { end: 100, suffix: "+", label: "Modules Delivered" },
                { end: 99, suffix: "%", label: "Client Satisfaction" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center space-y-1">
                  <strong className="block text-2xl md:text-3xl font-heading font-extrabold text-white">
                    <Counter end={stat.end} suffix={stat.suffix} />
                  </strong>
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest font-heading block">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
              <div className="flex flex-wrap gap-2 justify-center">
                {["all", "Healthcare", "Education", "Retail", "Enterprise", "HR", "AI"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 border rounded-xl text-xs font-heading font-bold transition-all duration-300 select-none ${
                      activeFilter === filter
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/15 scale-105"
                        : "bg-white/[0.01] border-white/[0.05] text-muted-text hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    {filter === "all" ? "All Sectors" : filter === "HR" ? "HRMS" : filter}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:max-w-xs">
                <input
                  type="search"
                  placeholder="Search stacks, modules, sectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#0A0F1D]/50 text-sm text-white placeholder-muted-text focus:outline-none focus:border-accent transition-colors font-body"
                />
              </div>
            </div>

            {/* Grid */}
            {filteredProjects.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProjectCard
                        project={project}
                        onOpen={openCaseStudy}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-16 border border-white/[0.04] bg-[#0A0F1D]/10 rounded-2xl">
                <p className="text-sm text-muted-text font-body">No projects match your filter query.</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* DETAILED FULL-SCREEN CASE STUDY VIEW */
          <motion.div
            key="case-study"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-6xl mx-auto px-6 md:px-8 relative z-10"
          >
            {/* Header Toolbar */}
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={handleCloseCaseStudy}
                className="flex items-center gap-2 text-xs font-heading font-bold text-muted-text hover:text-white transition-colors uppercase tracking-wider select-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Portfolio</span>
              </button>
              <div className="inline-flex gap-2">
                <Badge variant="status" color="primary">{selectedProject.industry}</Badge>
              </div>
            </div>

            {/* Case Study Hero Banner */}
            <div className="h-64 md:h-80 rounded-3xl relative overflow-hidden flex items-center justify-center p-8 mb-12 shadow-2xl" style={{ background: selectedProject.gradient }}>
              <i className={`${selectedProject.icon} text-8xl text-white/10 absolute`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent opacity-95" />
              
              <div className="relative z-10 text-center space-y-3 max-w-2xl">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-heading block">{selectedProject.title}</span>
                <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white leading-tight">
                  {selectedProject.subtitle}
                </h2>
              </div>
            </div>

            {/* Case Study Body Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
              
              {/* Left Column: Scope & Challenges */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Meta details */}
                <Card variant="glass" className="p-6 border-white/[0.08] backdrop-blur-xl">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest font-heading block mb-4">Specs Sheet</span>
                  <div className="space-y-3.5 text-xs text-white/95">
                    <div className="flex justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-muted-text">Timeline:</span>
                      <strong className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accent" /> {selectedProject.timeline}</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-muted-text">Status:</span>
                      <strong className="text-accent">{selectedProject.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-text">Industry:</span>
                      <strong>{selectedProject.industry}</strong>
                    </div>
                  </div>
                </Card>

                {/* Problems & Challenges */}
                <Card variant="glass" className="p-6 border-white/[0.08] backdrop-blur-xl space-y-4">
                  <span className="text-[10px] font-bold text-error uppercase tracking-widest font-heading flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Business Challenges
                  </span>
                  <div className="space-y-3">
                    {selectedProject.challenges.map((chal, idx) => (
                      <div key={idx} className="text-xs text-muted-text leading-relaxed font-body flex items-start gap-2">
                        <span className="text-error font-bold mt-0.5">•</span>
                        <span>{chal}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Objectives */}
                <Card variant="glass" className="p-6 border-white/[0.08] backdrop-blur-xl space-y-4">
                  <span className="text-[10px] font-bold text-white-text uppercase tracking-widest font-heading flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    Project Objectives
                  </span>
                  <div className="space-y-3">
                    {selectedProject.objectives.map((obj, idx) => (
                      <div key={idx} className="text-xs text-muted-text leading-relaxed font-body flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>

              {/* Right Column: Solutions, Stack, Modules & Outcomes */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Executive summary */}
                <Card variant="glass" className="p-8 border-white/[0.08] backdrop-blur-xl space-y-4 text-left">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-heading block">Case Summary</span>
                  <p className="text-base text-white/90 leading-relaxed font-body">
                    {selectedProject.description}
                  </p>
                </Card>

                {/* Solutions & Tech Stack */}
                <Card variant="glass" className="p-8 border-white/[0.08] backdrop-blur-xl space-y-6 text-left">
                  <span className="text-[10px] font-bold text-success uppercase tracking-widest font-heading flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-success" />
                    Engineering Solutions Deployed
                  </span>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {selectedProject.solutions.map((sol, idx) => (
                        <div key={idx} className="text-xs text-muted-text leading-relaxed font-body flex items-start gap-2">
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span>{sol}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Tech Badges */}
                    <div className="pt-4 border-t border-white/[0.04]">
                      <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest font-heading block mb-3">Tech Stacks Utilized</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech.map((t, idx) => (
                          <span key={idx} className="text-xs font-semibold text-accent border border-white/[0.06] bg-[#0A0F1D]/50 px-3 py-1 rounded-xl font-heading">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Modules built */}
                <Card variant="glass" className="p-8 border-white/[0.08] backdrop-blur-xl space-y-4 text-left">
                  <span className="text-[10px] font-bold text-white-text uppercase tracking-widest font-heading block">System Modules Delivered</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.modules.map((mod, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 bg-white/[0.01] border border-white/[0.04] rounded-xl text-xs font-semibold text-muted-text">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span>{mod}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Outcomes & Business Impact */}
                <Card variant="glass" className="p-8 border-white/[0.08] backdrop-blur-xl space-y-6 text-left">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-heading flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    Business Impact Benchmarks
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedProject.impact.map((imp, idx) => (
                      <div key={idx} className="bg-[#050816]/75 border border-white/[0.04] p-4 rounded-xl text-center space-y-1">
                        <strong className="block text-base md:text-lg font-heading font-extrabold text-white">{imp.split(" ")[0]}</strong>
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider block leading-relaxed">
                          {imp.split(" ").slice(1).join(" ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>

            </div>

            {/* Back button bottom */}
            <div className="flex justify-center pb-12">
              <Button variant="outline" onClick={handleCloseCaseStudy} icon={ArrowLeft} iconPosition="left">
                Return to Portfolio Gallery
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
