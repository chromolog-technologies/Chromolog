import React, { useState } from "react";
import { submitLead } from "../utils/leads";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Clock, User, Share2, CheckCircle, ChevronRight, BookOpen, Send } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { blogArticles } from "../data/blogPosts";

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const filteredArticles = blogArticles.filter((art) => {
    const q = searchQuery.toLowerCase();
    const matchesCategory = activeCategory === "All" || art.category === activeCategory;
    const matchesSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    setSubscribeError("");
    try {
      await submitLead("newsletter", { email, summary: "Blog newsletter signup" });
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setSubscribeError(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleOpenArticle = (art) => {
    setSelectedArticle(art);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToBlog = () => {
    setSelectedArticle(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative bg-bg-dark min-h-screen py-12">
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] bg-primary/4 blur-[110px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-accent/3 blur-[95px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10 pt-12">
        <AnimatePresence mode="wait">
          {!selectedArticle ? (
            /* BLOG LANDING VIEW */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-16"
            >
              {/* Head */}
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <Badge variant="ai" className="px-3 py-1 text-xs">Knowledge Hub</Badge>
                <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white leading-tight">
                  Insights on AI &amp; Software Engineering
                </h1>
                <p className="text-slate-300 text-base font-body">
                  Deep technical articles, database guides, and architectural notes curated by our product team.
                </p>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-y border-white/10 py-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {["All", "AI", "Development", "Cloud", "Healthcare", "Company Updates"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 border rounded-xl text-xs font-heading font-bold transition-all duration-300 select-none ${activeCategory === cat
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/15 scale-105"
                          : "bg-[#0a0d1d]/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0a0d1d]/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors font-body shadow-sm"
                  />
                </div>
              </div>

              {/* Articles Grid */}
              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleOpenArticle(art)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0a0d1d]/80 backdrop-blur-xl hover:border-cyan-400/40 hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full shadow-lg"
                    >
                      <div className="h-44 relative flex items-center justify-center p-6" style={{ background: art.coverGradient }}>
                        <BookOpen className="w-12 h-12 text-white/30 absolute transform transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        <Badge variant="status" color="primary" className="absolute top-4 right-4">{art.category}</Badge>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-heading">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {art.readTime}</span>
                            <span>&bull;</span>
                            <span>{art.date}</span>
                          </div>
                          <h2 className="text-lg font-heading font-extrabold text-white group-hover:text-cyan-400 transition-colors duration-300">
                            {art.title}
                          </h2>
                          <p className="text-xs text-slate-300 leading-relaxed font-body mt-2">
                            {art.summary}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-heading mt-4">
                          <span className="text-slate-300">{art.author.split(",")[0]}</span>
                          <span className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            Read Article <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-white/10 bg-[#0a0d1d]/80 rounded-2xl">
                  <p className="text-sm text-slate-300 font-body">No articles found matching your query.</p>
                </div>
              )}

              {/* Newsletter card */}
              <Card variant="glass" className="p-8 border-white/15 bg-[#0a0d1d]/90 shadow-2xl backdrop-blur-2xl relative z-10 text-center max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-heading block">Newsletter</span>
                  <h3 className="text-2xl font-heading font-bold text-white">Subscribe to Tech Notes</h3>
                  <p className="text-xs text-slate-300 font-body max-w-sm mx-auto">Receive updates on AI capabilities, web architecture, and multi-tenant databases.</p>
                </div>

                <AnimatePresence mode="wait">
                  {!subscribed ? (
                    <motion.form
                      key="form"
                      onSubmit={handleSubscribe}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
                    >
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#050816] border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 font-body"
                        required
                      />
                      <Button variant="primary" type="submit" icon={Send} iconPosition="right" loading={subscribing} disabled={subscribing}>
                        Subscribe
                      </Button>
                      {subscribeError && <p className="text-xs text-red-300 basis-full" role="alert">{subscribeError}</p>}
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Thank you! You have successfully subscribed.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ) : (
            /* BLOG ARTICLE DETAIL VIEW */
            <motion.div
              key="article"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-3xl mx-auto space-y-10"
            >
              {/* Back Toolbar */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleBackToBlog}
                  className="flex items-center gap-2 text-xs font-heading font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider select-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Hub</span>
                </button>
                <Badge variant="status" color="primary">{selectedArticle.category}</Badge>
              </div>

              {/* Cover Banner */}
              <div className="h-44 md:h-56 rounded-3xl relative overflow-hidden flex items-center justify-center p-8 shadow-2xl" style={{ background: selectedArticle.coverGradient }}>
                <BookOpen className="w-16 h-16 text-white/15 absolute" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent opacity-95" />
                <div className="relative z-10 text-center space-y-3">
                  <div className="flex justify-center items-center gap-4 text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-heading">
                    <span>{selectedArticle.readTime}</span>
                    <span>&bull;</span>
                    <span>{selectedArticle.date}</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-white leading-tight">
                    {selectedArticle.title}
                  </h1>
                </div>
              </div>

              {/* Author & Share */}
              <div className="flex justify-between items-center border-y border-white/10 py-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>By <strong className="text-white">{selectedArticle.author}</strong></span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Article link copied!");
                  }}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-bold uppercase tracking-wider font-heading text-[10px]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Main Content Render */}
              <div className="article-body text-slate-200 text-base leading-relaxed font-body space-y-6 text-left">
                {/* Parse Markdown Blocks */}
                {selectedArticle.content.split("\n\n").map((block, idx) => {
                  const trimBlock = block.trim();
                  if (!trimBlock) return null;

                  if (trimBlock.startsWith("# ")) {
                    return (
                      <h2 key={idx} className="text-2xl md:text-3xl font-heading font-extrabold text-white pt-4">
                        {trimBlock.replace("# ", "")}
                      </h2>
                    );
                  }
                  if (trimBlock.startsWith("## ")) {
                    return (
                      <h3 key={idx} className="text-xl md:text-2xl font-heading font-bold text-white pt-2 border-b border-white/10 pb-2">
                        {trimBlock.replace("## ", "")}
                      </h3>
                    );
                  }
                  if (trimBlock.startsWith("> [!TIP]")) {
                    return (
                      <div key={idx} className="p-4 border-l-4 border-cyan-400 bg-cyan-950/40 rounded-r-xl text-sm leading-relaxed text-cyan-200 border-t border-b border-r border-cyan-500/20">
                        <strong className="text-white block mb-1">Tip</strong>
                        {trimBlock.replace("> [!TIP]\n", "").replace("> ", "")}
                      </div>
                    );
                  }
                  if (trimBlock.startsWith("> [!IMPORTANT]")) {
                    return (
                      <div key={idx} className="p-4 border-l-4 border-purple-400 bg-purple-950/40 rounded-r-xl text-sm leading-relaxed text-purple-200 border-t border-b border-r border-purple-500/20">
                        <strong className="text-white block mb-1">Important</strong>
                        {trimBlock.replace("> [!IMPORTANT]\n", "").replace("> ", "")}
                      </div>
                    );
                  }
                  if (trimBlock.startsWith("| ")) {
                    // Simple table rendering
                    const lines = trimBlock.split("\n");
                    const rows = lines.filter((l) => l.startsWith("|"));
                    return (
                      <div key={idx} className="overflow-x-auto my-4">
                        <table className="min-w-full divide-y divide-white/[0.06] text-xs font-semibold">
                          <tbody className="divide-y divide-white/[0.04]">
                            {rows.map((row, rIdx) => {
                              const cols = row.split("|").slice(1, -1);
                              return (
                                <tr key={rIdx} className={rIdx === 0 ? "bg-white/[0.02]" : ""}>
                                  {cols.map((col, cIdx) => (
                                    <td key={cIdx} className="px-4 py-3 text-muted-text text-left">
                                      {col.trim()}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  // Standard paragraphs
                  return (
                    <p key={idx} className="font-body">
                      {trimBlock.split("\n").map((line, lIdx) => {
                        // Check for list bullet items
                        if (line.trim().startsWith("- ")) {
                          return (
                            <span key={lIdx} className="block pl-4 relative my-1 text-muted-text">
                              <span className="absolute left-0 text-accent font-extrabold">•</span>
                              {line.trim().replace("- ", "")}
                            </span>
                          );
                        }
                        if (line.trim().match(/^\d+\.\s/)) {
                          return (
                            <span key={lIdx} className="block pl-4 relative my-1 text-muted-text">
                              <span className="absolute left-0 text-accent font-bold">{line.trim().split(".")[0]}.</span>
                              {line.trim().replace(/^\d+\.\s/, "")}
                            </span>
                          );
                        }
                        return <span key={lIdx} className="block">{line}</span>;
                      })}
                    </p>
                  );
                })}
              </div>

              {/* Back to hub bottom */}
              <div className="flex justify-center border-t border-white/[0.06] pt-10 pb-12">
                <Button variant="outline" onClick={handleBackToBlog} icon={ArrowLeft} iconPosition="left">
                  Return to Knowledge Hub
                </Button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
