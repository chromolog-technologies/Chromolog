import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Code2, Link2, Sparkles } from "lucide-react";
import Badge from "./ui/Badge";
import Card from "./ui/Card";

const technologies = [
  // Inner Orbit
  { id: "react", name: "React", abbr: "Re", color: "#61DAFB", orbit: 1, speed: 0.15, desc: "A frontend library for building highly interactive single-page application interfaces.", pros: ["Virtual DOM speed", "Massive ecosystem", "Component reuse"], exp: "Expert", projects: ["AlphaGrew Dashboard", "YCDC Transformation Portal", "Library E-Gate"] },
  { id: "laravel", name: "Laravel", abbr: "La", color: "#FF2D20", orbit: 1, speed: -0.15, desc: "A premium MVC framework for PHP powering our robust database integrations and Rest APIs.", pros: ["Elegant syntax", "Redis job queuing", "Sanctum authentication"], exp: "Expert", projects: ["HumaNode HRMS", "Clinic SaaS", "iPhone Multi-Store Vault"] },
  { id: "nextjs", name: "Next.js", abbr: "Nx", color: "#ffffff", orbit: 1, speed: 0.12, desc: "A React meta-framework enabling server-side rendering, static site generation, and optimized routes.", pros: ["SEO excellence", "Edge deployments", "Image optimization"], exp: "Advanced", projects: ["Enterprise Startup ERP"] },
  { id: "nodejs", name: "Node.js", abbr: "No", color: "#339933", orbit: 1, speed: -0.12, desc: "An asynchronous event-driven JavaScript runtime built to execute scalable network applications.", pros: ["High throughput", "V8 speed engine", "Unified code stack"], exp: "Advanced", projects: ["LMS Express services"] },
  
  // Middle Orbit
  { id: "flutter", name: "Flutter", abbr: "Fl", color: "#02569B", orbit: 2, speed: 0.08, desc: "Google's UI software development kit for crafting native applications from a single codebase.", pros: ["Native compilation", "Skia performance", "Frictionless styling"], exp: "Expert", projects: ["Chest Hospital App", "Biometric Sync Agent", "Gym Platform"] },
  { id: "python", name: "Python", abbr: "Py", color: "#3776AB", orbit: 2, speed: -0.08, desc: "A versatile language optimized for machine learning, artificial intelligence pipelines, and script tasks.", pros: ["Clean data syntax", "TensorFlow & PyTorch", "Pandas processing"], exp: "Advanced", projects: ["AI Resume Parser", "Placement Predictor Model"] },
  { id: "typescript", name: "TypeScript", abbr: "TS", color: "#3178C6", orbit: 2, speed: 0.07, desc: "A strongly typed superset of JavaScript that adds structural validation and editor autocompletes.", pros: ["Type safety", "Refactor security", "Fewer runtime errors"], exp: "Expert", projects: ["Modern Web Frontend Projects", "Clean Architecture Models"] },
  { id: "openai", name: "OpenAI", abbr: "AI", color: "#10a37f", orbit: 2, speed: -0.07, desc: "State-of-the-art cognitive engines including GPT models utilized for agentic workflow automations.", pros: ["Advanced reasoning", "Fine-tuning capabilities", "Semantic token analysis"], exp: "Advanced", projects: ["Cognitive AI Agents", "Resume Analyzer API"] },
  { id: "claude", name: "Claude", abbr: "Cl", color: "#D97706", orbit: 2, speed: 0.06, desc: "Anthropic's LLM ecosystem suited for deep document analyses, multi-step planning, and coding assistance.", pros: ["Large context window", "Precise data extraction", "System prompt compliance"], exp: "Advanced", projects: ["Document Intelligence pipelines"] },

  // Outer Orbit
  { id: "gemini", name: "Gemini", abbr: "Gm", color: "#7c3aed", orbit: 3, speed: 0.04, desc: "Google's multimodal AI platform supporting parallel text, code, audio, and visual reasoning.", pros: ["Multimodal inputs", "Google Workspace integration", "High token speed"], exp: "Advanced", projects: ["Medical AI Analysis", "Speech Recognition assistant"] },
  { id: "aws", name: "AWS", abbr: "AW", color: "#FF9900", orbit: 3, speed: -0.04, desc: "Cloud infrastructure provisioning including ECS, Lightsail, S3 buckets, and RDS instances.", pros: ["99.99% Uptime", "Global CDN routing", "Elastic container scaling"], exp: "Expert", projects: ["All Production Deployments", "LMS S3 Storage CDN"] },
  { id: "docker", name: "Docker", abbr: "Dk", color: "#2496ED", orbit: 3, speed: 0.045, desc: "A platform designed to package applications inside lightweight containers for unified environments.", pros: ["Isolated layers", "Frictionless deploys", "Resource efficiency"], exp: "Expert", projects: ["Startup ERP Monolith", "Node Microservices", "CI/CD testing"] },
  { id: "postgresql", name: "PostgreSQL", abbr: "PG", color: "#336791", orbit: 3, speed: -0.045, desc: "A powerful object-relational SQL database engine supporting concurrent reads and JSONB stores.", pros: ["ACID compliance", "JSONB indexing speed", "Relational stability"], exp: "Expert", projects: ["HumaNode HRMS", "YCDC Workflow DB", "CRM leads logs"] },
  { id: "firebase", name: "Firebase", abbr: "Fb", color: "#FFCA28", orbit: 3, speed: 0.05, desc: "Google's real-time mobile platform supporting push notifications, firestore, and oauth.", pros: ["Real-time sync", "Instant notifications", "Frictionless OAuth"], exp: "Advanced", projects: ["Chest Hospital Sync", "Mobile push alerts"] },
];

const orbitRadius = { 1: 95, 2: 155, 3: 215 };

export default function TechOrbit() {
  const [selectedTech, setSelectedTech] = useState(technologies[0]);
  const [hoveredTech, setHoveredTech] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    let animId;
    const tick = () => {
      if (!isHoveredRef.current) {
        setRotationAngle((prev) => (prev + 0.003) % (Math.PI * 2));
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section className="relative bg-bg-dark overflow-hidden py-16 md:py-24 border-t border-white/[0.05]" id="ecosystem">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-15%] w-[400px] h-[400px] bg-primary/4 blur-[120px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute bottom-[20%] right-[-15%] w-[350px] h-[350px] bg-accent/4 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="section-head reveal text-center max-w-3xl mx-auto mb-16">
          <Badge variant="ai" className="mb-3 px-3 py-1 text-xs">Technology Stack</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mt-2">
            Our Interactive Technology Ecosystem
          </h2>
          <p className="text-muted-text text-base mt-4 max-w-xl mx-auto font-body">
            Hover over any node to inspect details, architecture benefits, and live project associations.
          </p>
        </div>

        {/* Orbit Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Interactive SVG Orbit */}
          <div
            className="lg:col-span-6 flex justify-center items-center select-none"
            onMouseEnter={() => {
              isHoveredRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
              setHoveredTech(null);
            }}
          >
            <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center bg-white/[0.01] border border-white/[0.04] rounded-full p-4 shadow-inner">
              
              <svg viewBox="0 0 500 500" className="w-full h-full overflow-visible">
                
                {/* 1. Orbit Guide Rings */}
                {[95, 155, 215].map((r, idx) => (
                  <circle
                    key={idx}
                    cx="250"
                    cy="250"
                    r={r}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                  />
                ))}

                {/* 2. Concentric Orbit Nodes */}
                {technologies.map((tech) => {
                  const radius = orbitRadius[tech.orbit];
                  // Distribute nodes equally around the orbit ring
                  const siblingNodes = technologies.filter((t) => t.orbit === tech.orbit);
                  const baseAngle = (siblingNodes.indexOf(tech) / siblingNodes.length) * Math.PI * 2;
                  
                  // Add continuous rotation angle
                  const currentAngle = baseAngle + rotationAngle * (tech.speed > 0 ? 1 : -1) * Math.abs(tech.speed) * 4;

                  const cx = 250 + radius * Math.cos(currentAngle);
                  const cy = 250 + radius * Math.sin(currentAngle);

                  const isHovered = hoveredTech?.id === tech.id;
                  const isSelected = selectedTech?.id === tech.id;

                  return (
                    <g
                      key={tech.id}
                      onClick={() => setSelectedTech(tech)}
                      onMouseEnter={() => setHoveredTech(tech)}
                      className="cursor-pointer"
                    >
                      {/* Pulsing halo on hover/select */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="26"
                          fill="none"
                          stroke={tech.color}
                          strokeWidth="1.5"
                          opacity="0.35"
                        />
                      )}

                      {/* Background Node Circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="20"
                        fill={isSelected ? tech.color : "rgba(10, 15, 29, 0.95)"}
                        stroke={isHovered || isSelected ? tech.color : "rgba(255,255,255,0.08)"}
                        strokeWidth={isSelected ? 0 : 1.5}
                      />

                      {/* 2-char abbreviation — renders reliably in SVG */}
                      <text
                        x={cx}
                        y={cy + 5}
                        textAnchor="middle"
                        fill={isSelected ? "#050816" : isHovered ? tech.color : "rgba(255,255,255,0.75)"}
                        fontSize="9"
                        fontWeight="800"
                        fontFamily="Space Grotesk, Sora, sans-serif"
                        letterSpacing="0.5"
                      >
                        {tech.abbr}
                      </text>

                      {/* Floating tooltip pill on hover */}
                      {isHovered && (
                        <g>
                          <rect
                            x={cx - 34}
                            y={cy - 44}
                            width="68"
                            height="19"
                            rx="9.5"
                            fill={tech.color}
                            opacity="0.95"
                          />
                          <polygon
                            points={`${cx - 4},${cy - 26} ${cx + 4},${cy - 26} ${cx},${cy - 20}`}
                            fill={tech.color}
                            opacity="0.95"
                          />
                          <text
                            x={cx}
                            y={cy - 31}
                            textAnchor="middle"
                            fill="#050816"
                            fontSize="8.5"
                            fontWeight="700"
                            fontFamily="Space Grotesk, Sora, sans-serif"
                          >
                            {tech.name}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 3. Center Brand Shield */}
                <g className="cursor-default">
                  <circle
                    cx="250"
                    cy="250"
                    r="40"
                    fill="rgba(5, 8, 22, 0.98)"
                    stroke="rgba(0, 229, 255, 0.35)"
                    strokeWidth="2.5"
                    className="shadow-[0_0_20px_rgba(0,229,255,0.2)]"
                  />
                  <circle
                    cx="250"
                    cy="250"
                    r="34"
                    fill="rgba(79, 70, 229, 0.15)"
                  />
                  <text
                    x="250"
                    y="254"
                    textAnchor="middle"
                    fill="#00E5FF"
                    fontSize="11"
                    fontWeight="extrabold"
                    className="font-heading tracking-wider"
                  >
                    CHROMOLOG
                  </text>
                </g>

              </svg>
            </div>
          </div>

          {/* Right Side: Detailed Metadata Display Panel */}
          <div className="lg:col-span-6 flex items-stretch">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTech.id}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full flex"
              >
                <Card
                  variant="glass"
                  className="w-full p-8 border-white/[0.08] shadow-2xl backdrop-blur-xl flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-white/[0.06] pb-4">
                      <div
                        className="w-12 h-12 rounded-xl border flex items-center justify-center text-2xl"
                        style={{
                          color: selectedTech.color,
                          borderColor: `${selectedTech.color}25`,
                          backgroundColor: `${selectedTech.color}08`,
                        }}
                      >
                        <span style={{ fontFamily: "remixicon" }}>
                          <i className={selectedTech.icon}></i>
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-heading font-extrabold text-white">
                            {selectedTech.name}
                          </h3>
                          <Badge variant="status" color="primary" className="text-[9px] px-2 py-0.5 uppercase tracking-wider">
                            {selectedTech.exp}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest mt-1">Technology Scope</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-text leading-relaxed font-body">
                      {selectedTech.desc}
                    </p>

                    {/* Architecture Advantages */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-white-text uppercase tracking-widest font-heading flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        Key Advantages
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedTech.pros.map((pro, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="text-[10px] font-bold text-white-text/90 leading-tight font-heading">{pro}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live Projects utilizing it */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-white-text uppercase tracking-widest font-heading flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-primary" />
                        In-Production Integrations
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedTech.projects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] font-semibold text-muted-text border border-white/[0.06] bg-[#0A0F1D]/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-heading"
                          >
                            <Code2 className="w-3 h-3 text-accent" />
                            <span>{proj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-6 mt-8 flex justify-between items-center text-[10px] font-bold text-muted-text uppercase tracking-widest font-heading">
                    <span>Expertise benchmark</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < (selectedTech.exp === "Expert" ? 5 : 4)
                              ? "text-accent fill-accent"
                              : "text-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
