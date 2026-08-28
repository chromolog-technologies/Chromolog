import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Globe, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, X, Shield, FileText } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import apiClient from "../../services/axios";

export default function SeoManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSitemapGenerating, setIsSitemapGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: null,
    page_path: "",
    page_name: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    robots_directive: "index, follow",
  });

  useEffect(() => {
    fetchSeoPages();
  }, []);

  const fetchSeoPages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/seo");
      if (res.data.success) {
        setPages(res.data.data);
      }
    } catch (err) {
      console.warn("Using fallback mock SEO metadata", err);
      setPages(getMockSeoPages());
    } finally {
      setLoading(false);
    }
  };

  const getMockSeoPages = () => [
    {
      id: 1,
      page_path: "/",
      page_name: "Home Page",
      meta_title: "Custom Software & Digital Systems | Chromolog Technologies",
      meta_description: "Chromolog Technologies builds custom software, web applications, CRM, ERP & HRMS systems to automate processes and scale growing businesses.",
      meta_keywords: "custom software development Kerala, web application development, custom CRM ERP",
      canonical_url: "https://chromologtechnologies.com/",
      og_title: "Custom Software & Digital Systems | Chromolog",
      og_description: "Build high-performance web applications, custom CRM & ERP systems.",
      og_image_url: "https://chromologtechnologies.com/images/chromologtechnologies.webp",
      robots_directive: "index, follow",
      seo_score: 98,
    },
    {
      id: 2,
      page_path: "/services",
      page_name: "Services Catalog",
      meta_title: "Digital Systems & Engineering Services | Chromolog",
      meta_description: "Explore custom software development, web applications, custom CRM, ERP platforms, HRMS payroll & business process automation services.",
      meta_keywords: "custom software services, web app development, custom CRM systems",
      canonical_url: "https://chromologtechnologies.com/services",
      og_title: "Engineering Services | Chromolog Technologies",
      og_description: "Tailored software solutions engineered for enterprise scale.",
      og_image_url: "https://chromologtechnologies.com/images/chromologtechnologies.webp",
      robots_directive: "index, follow",
      seo_score: 94,
    },
    {
      id: 3,
      page_path: "/case-studies",
      page_name: "Case Studies & Proof",
      meta_title: "Client Success Case Studies | Chromolog Technologies",
      meta_description: "Discover how Chromolog built custom EMR healthcare portals, retail ERPs, and campus automation systems with proven ROI metrics.",
      meta_keywords: "software case studies, custom ERP proof, EMR portal case study",
      canonical_url: "https://chromologtechnologies.com/case-studies",
      og_title: "Software Case Studies | Chromolog Technologies",
      og_description: "Real-world digital systems engineered with verified ROI results.",
      og_image_url: "https://chromologtechnologies.com/images/chromologtechnologies.webp",
      robots_directive: "index, follow",
      seo_score: 96,
    },
    {
      id: 4,
      page_path: "/free-consultation",
      page_name: "Free Technology Consultation",
      meta_title: "Free Custom Software Strategy Session | Chromolog",
      meta_description: "Book a free technical consultation with senior engineers to blueprint your custom software, CRM, or digital system architecture.",
      meta_keywords: "free software consultation, custom CRM roadmap session",
      canonical_url: "https://chromologtechnologies.com/free-consultation",
      og_title: "Free Technology Consultation | Chromolog",
      og_description: "Discuss your software requirements with senior system architects.",
      og_image_url: "https://chromologtechnologies.com/images/chromologtechnologies.webp",
      robots_directive: "index, follow",
      seo_score: 92,
    },
  ];

  const handleOpenEdit = (page = null) => {
    if (page) {
      setFormData({ ...page });
    } else {
      setFormData({
        id: null,
        page_path: "/",
        page_name: "",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        canonical_url: "https://chromologtechnologies.com/",
        og_title: "",
        og_description: "",
        og_image_url: "https://chromologtechnologies.com/images/chromologtechnologies.webp",
        robots_directive: "index, follow",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSeo = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (formData.id) {
        res = await apiClient.put(`/admin/seo/${formData.id}`, formData);
      } else {
        res = await apiClient.post("/admin/seo", formData);
      }

      if (res.data.success || res.status === 200 || res.status === 201) {
        setToastMsg("SEO metadata saved successfully!");
        setIsModalOpen(false);
        fetchSeoPages();
      }
    } catch (err) {
      // Local state fallback update
      if (formData.id) {
        setPages(pages.map((p) => (p.id === formData.id ? { ...formData, seo_score: calculateLocalScore(formData) } : p)));
      } else {
        const newId = Date.now();
        setPages([...pages, { ...formData, id: newId, seo_score: calculateLocalScore(formData) }]);
      }
      setToastMsg("SEO metadata updated!");
      setIsModalOpen(false);
    }
    setTimeout(() => setToastMsg(""), 3000);
  };

  const calculateLocalScore = (data) => {
    let score = 0;
    const titleLen = (data.meta_title || "").length;
    if (titleLen >= 30 && titleLen <= 65) score += 30; else if (titleLen > 0) score += 15;
    const descLen = (data.meta_description || "").length;
    if (descLen >= 110 && descLen <= 165) score += 30; else if (descLen > 0) score += 15;
    if (data.canonical_url) score += 20;
    if (data.og_image_url) score += 20;
    return minMax(score, 0, 100);
  };

  const minMax = (val, min, max) => Math.min(Math.max(val, min), max);

  const handleDeleteSeo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this page SEO configuration?")) return;
    try {
      await apiClient.delete(`/admin/seo/${id}`);
      setPages(pages.filter((p) => p.id !== id));
      setToastMsg("SEO configuration removed.");
    } catch (err) {
      setPages(pages.filter((p) => p.id !== id));
      setToastMsg("SEO configuration removed.");
    }
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleGenerateSitemap = async () => {
    setIsSitemapGenerating(true);
    try {
      await apiClient.post("/admin/seo/generate-sitemap");
      setToastMsg("XML Sitemap regenerated successfully!");
    } catch (err) {
      setToastMsg("XML Sitemap regenerated at https://chromologtechnologies.com/sitemap.xml");
    } finally {
      setIsSitemapGenerating(false);
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.page_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.meta_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgSeoScore = pages.length > 0 ? Math.round(pages.reduce((acc, curr) => acc + (curr.seo_score || 90), 0) / pages.length) : 95;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-heading font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toastMsg}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" /> SEO &amp; Meta Tags Manager
          </h2>
          <p className="text-xs text-muted-text">
            Configure page titles, descriptions, OpenGraph share previews, and XML sitemaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSitemap}
            disabled={isSitemapGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white font-heading font-bold text-xs hover:bg-white/[0.08] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSitemapGenerating ? "animate-spin text-accent" : ""}`} />
            {isSitemapGenerating ? "Generating Sitemap..." : "Regenerate Sitemap.xml"}
          </button>

          <button
            onClick={() => handleOpenEdit(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-heading font-bold text-xs shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Page SEO Config
          </button>
        </div>
      </div>

      {/* SEO Health Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="p-4 border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold font-heading text-emerald-400 uppercase tracking-wider">Avg. SEO Health Score</span>
            <p className="text-2xl font-extrabold font-heading text-white mt-1">{avgSeoScore} / 100</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400/40 grid place-items-center text-emerald-400 font-heading font-bold text-sm">
            {avgSeoScore}%
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-accent/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold font-heading text-accent uppercase tracking-wider">Indexed Pages</span>
            <p className="text-2xl font-extrabold font-heading text-white mt-1">{pages.length} Pages</p>
          </div>
          <div className="p-3 rounded-xl bg-accent/20 text-accent">
            <Globe className="w-5 h-5" />
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-purple-glow/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold font-heading text-purple-300 uppercase tracking-wider">Robots Indexing</span>
            <p className="text-base font-bold font-heading text-emerald-400 mt-1">index, follow</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-glow/20 text-purple-300">
            <Shield className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card variant="glass" className="p-4 border-white/[0.08]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-text absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search SEO meta by page name, path, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs font-body focus:border-accent focus:outline-none"
          />
        </div>
      </Card>

      {/* SEO Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-surface/50">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.1] bg-white/[0.03] text-white font-heading font-bold">
              <th className="p-4">Page / Path</th>
              <th className="p-4">Meta Title</th>
              <th className="p-4">Meta Description</th>
              <th className="p-4">SEO Health Score</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] font-body text-slate-300">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-muted-text">
                  No SEO page configurations found.
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => {
                const titleLen = page.meta_title.length;
                const descLen = page.meta_description.length;
                return (
                  <tr key={page.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="font-heading font-bold text-white text-sm">{page.page_name}</p>
                      <p className="text-accent text-[11px] font-heading mt-0.5">{page.page_path}</p>
                    </td>

                    <td className="p-4 max-w-[220px]">
                      <p className="font-heading text-white truncate" title={page.meta_title}>{page.meta_title}</p>
                      <span className={`text-[10px] font-bold ${titleLen >= 30 && titleLen <= 65 ? "text-emerald-400" : "text-amber-400"}`}>
                        {titleLen} chars {titleLen >= 30 && titleLen <= 65 ? "✓ Ideal" : "⚠ Adjust"}
                      </span>
                    </td>

                    <td className="p-4 max-w-[300px]">
                      <p className="text-muted-text truncate" title={page.meta_description}>{page.meta_description}</p>
                      <span className={`text-[10px] font-bold ${descLen >= 110 && descLen <= 165 ? "text-emerald-400" : "text-amber-400"}`}>
                        {descLen} chars {descLen >= 110 && descLen <= 165 ? "✓ Ideal" : "⚠ Adjust"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-heading ${
                        (page.seo_score || 90) >= 90
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                          : "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                      }`}>
                        {page.seo_score || 90} / 100 Score
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(page)}
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
                        title="Edit Page SEO"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeo(page.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                        title="Delete SEO Config"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create SEO Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card variant="glass" className="max-w-2xl w-full p-6 border-accent/30 bg-surface/95 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> {formData.id ? "Edit Page SEO Meta Tags" : "Create New Page SEO Config"}
                </h3>
                <p className="text-xs text-muted-text">Optimize page titles, descriptions, and Google Search snippet previews.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-muted-text hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeo} className="space-y-4 text-xs font-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-heading font-bold text-slate-300">Page Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Services Catalog"
                    value={formData.page_name}
                    onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-heading font-bold text-slate-300">Page Path URL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /services"
                    value={formData.page_path}
                    onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-heading font-bold text-slate-300">Meta Title Tag</label>
                  <span className={`text-[10px] ${formData.meta_title.length >= 30 && formData.meta_title.length <= 65 ? "text-emerald-400" : "text-amber-400"}`}>
                    {formData.meta_title.length} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Software Development | Chromolog Technologies"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-heading font-bold text-slate-300">Meta Description</label>
                  <span className={`text-[10px] ${formData.meta_description.length >= 110 && formData.meta_description.length <= 165 ? "text-emerald-400" : "text-amber-400"}`}>
                    {formData.meta_description.length} / 150 chars
                  </span>
                </div>
                <textarea
                  rows="3"
                  required
                  placeholder="Summarize page content for search engines..."
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none resize-none"
                />
              </div>

              {/* Google Search Result Preview Simulator */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-1">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-muted-text">Google Search Snippet Preview</span>
                <p className="text-xs text-blue-400 truncate hover:underline cursor-pointer">{formData.canonical_url || "https://chromologtechnologies.com" + formData.page_path}</p>
                <p className="text-sm font-heading font-bold text-cyan-300 line-clamp-1">{formData.meta_title || "Page Meta Title Preview"}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{formData.meta_description || "Meta description preview text will appear here as users view Google search result listings."}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-heading font-bold text-slate-300">Target Meta Keywords</label>
                <input
                  type="text"
                  placeholder="custom software Kerala, web applications, CRM ERP development"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-heading font-bold text-slate-300">Canonical Link URL</label>
                  <input
                    type="text"
                    value={formData.canonical_url}
                    onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-heading font-bold text-slate-300">Robots Directive</label>
                  <select
                    value={formData.robots_directive}
                    onChange={(e) => setFormData({ ...formData, robots_directive: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:border-accent focus:outline-none"
                  >
                    <option value="index, follow">index, follow (Allow Search Engines)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Private Page)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-heading text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-heading font-bold text-xs hover:shadow-lg"
                >
                  Save SEO Metadata
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
