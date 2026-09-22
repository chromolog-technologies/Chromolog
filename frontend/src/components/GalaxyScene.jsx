import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────
   CHROMOLOG TECHNOLOGY GALAXY — React Canvas Component
   Ported from chromolog_technology_galaxy-6.html
   ───────────────────────────────────────────────────────────── */

// ── Planet data ──────────────────────────────────────────────
const PLANETS = [
  { name: "Custom Web Applications", tag: "WEB APPLICATIONS", color: "#35aaff", x: -0.45, y: -0.06, size: 31, icon: "</>", mat: "glass", orbit: 0.48, speed: 0.42, spin: 1.35, tilt: 0.22, text: "Scalable web applications engineered around your exact business logic, workflows and security requirements.", list: ["Scalable Architecture", "Modern Tech Stack", "High Performance", "SEO Optimized"] },
  { name: "Flutter Mobile Apps", tag: "MOBILE", color: "#54e6ff", x: 0.45, y: -0.26, size: 27, icon: "✦", mat: "crystal", orbit: 0.64, speed: 0.31, spin: 1.8, tilt: -0.16, text: "Cross-platform mobile applications and mobile agent workflows built in Flutter.", list: ["Cross-platform development", "Mobile agent workflows", "Connected business data"] },
  { name: "Enterprise ERP", tag: "ERP", color: "#9865ff", x: 0.12, y: 0.42, size: 34, icon: "ERP", mat: "metal", orbit: 0.78, speed: 0.22, spin: 0.92, tilt: 0.12, text: "Unified enterprise systems that connect operational data, processes and departments.", list: ["Unified workflows", "PostgreSQL database", "Scalable architecture"] },
  { name: "HRMS & Biometric Attendance", tag: "HRMS", color: "#bb75ff", x: -0.56, y: 0.38, size: 27, icon: "HR", mat: "glass", orbit: 0.89, speed: 0.18, spin: 1.18, tilt: -0.25, text: "HR workflows with biometric attendance, staff access and automation.", list: ["Biometric attendance", "Staff access", "Payroll workflows"] },
  { name: "Custom CRM Portals", tag: "CRM", color: "#45c5ff", x: 0.62, y: 0.32, size: 29, icon: "CRM", mat: "crystal", orbit: 1.01, speed: 0.145, spin: 1.55, tilt: 0.18, text: "Custom CRM portals tailored to how teams manage customers, leads and operations.", list: ["Custom workflows", "Connected customer data", "Operational visibility"] },
  { name: "Business Automation", tag: "AUTOMATION", color: "#7e86ff", x: -0.78, y: -0.42, size: 25, icon: "⚡", mat: "energy", orbit: 1.10, speed: 0.12, spin: 2.05, tilt: -0.1, text: "Replace disconnected manual workflows with connected automation.", list: ["WhatsApp messaging", "Billing automation", "Staff access automation"] },
  { name: "Healthcare Queues & EMR", tag: "HEALTHCARE", color: "#52e0c2", x: 0.78, y: -0.48, size: 24, icon: "✚", mat: "bio", orbit: 1.18, speed: 0.10, spin: 1.28, tilt: 0.28, text: "A supported Chromolog solution area for healthcare queues and electronic medical records.", list: ["Healthcare queues", "EMR workflows", "Connected operations"] },
  { name: "Campus ERP & LMS", tag: "EDUCATION", color: "#ffb35a", x: -0.12, y: -0.58, size: 23, icon: "EDU", mat: "glass", orbit: 1.27, speed: 0.085, spin: 1.72, tilt: -0.18, text: "A supported solution area for educational institutions and connected campus operations.", list: ["Campus ERP", "Learning management", "Unified data"] },
  { name: "Multi-Branch Retail POS", tag: "RETAIL", color: "#ff6f9e", x: 0.86, y: 0.02, size: 24, icon: "POS", mat: "metal", orbit: 1.36, speed: 0.072, spin: 1.02, tilt: 0.2, text: "Connected retail operations for networks with multiple branches.", list: ["Multi-branch operations", "Shared data", "Retail POS"] },
  { name: "AWS Cloud Architecture", tag: "CLOUD", color: "#78a9ff", x: -0.82, y: 0.08, size: 22, icon: "☁", mat: "cloud", orbit: 1.44, speed: 0.062, spin: 0.82, tilt: -0.12, text: "Scalable cloud infrastructure designed for growing data volume and application demands.", list: ["AWS architecture", "Scalability", "Cloud infrastructure"] },
  { name: "PostgreSQL Data", tag: "DATA", color: "#6ed9ff", x: 0.28, y: -0.72, size: 22, icon: "DB", mat: "data", orbit: 1.53, speed: 0.052, spin: 1.12, tilt: 0.24, text: "A unified PostgreSQL cloud database architecture at the core of custom digital systems.", list: ["Unified schema", "Cloud database", "Data ownership"] },
  { name: "Billing Systems", tag: "BILLING", color: "#d78bff", x: 0.54, y: 0.62, size: 22, icon: "₹", mat: "energy", orbit: 1.61, speed: 0.045, spin: 1.4, tilt: -0.2, text: "Automated business billing connected to the wider digital system.", list: ["Billing workflows", "Connected database", "Operational automation"] },
];

// ── Color helpers ────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex, a) {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export default function GalaxyScene() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    W: 0, H: 0, dpr: 1,
    scale: 1, panX: 0, panY: 0,
    drag: false, lastX: 0, lastY: 0,
    orbit: true, t: 0, simTime: 0,
    pinchStart: 0, pinchScale: 1,
    stars: [],
    animId: null,
  });
  const [modal, setModal] = useState(null);
  const reducedRef = useRef(false);

  // ── World position calculation ───────────────────────────
  const worldPos = useCallback((p, index, st) => {
    const depth = Math.min(st.W, st.H) * 0.72 * st.scale;
    const baseAngle = Math.atan2(p.y, p.x);
    const angle = baseAngle + st.simTime * (p.speed || 0.1);
    const radius = Math.hypot(p.x, p.y) * (p.orbit || 1);
    const z = Math.sin(angle * (0.82 + (index % 3) * 0.08) + index) * 0.34;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.72 + z * 0.10;
    return {
      x: st.W / 2 + x * depth + st.panX,
      y: st.H / 2 + y * depth + st.panY,
      z,
      rotation: st.simTime * (p.spin || 1.2),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const st = stateRef.current;
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Load Chromolog Logo image
    const logoImg = new Image();
    let logoLoaded = false;
    logoImg.src = "/images/chromolog-logo.webp";
    logoImg.onload = () => {
      logoLoaded = true;
    };
    logoImg.onerror = () => {
      logoImg.src = "/images/chromolog logo transparent.png";
    };

    // ── Resize ──────────────────────────────────────────────
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      st.W = parent.clientWidth;
      st.H = parent.clientHeight;
      canvas.width = st.W * st.dpr;
      canvas.height = st.H * st.dpr;
      canvas.style.width = st.W + "px";
      canvas.style.height = st.H + "px";
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      // Regenerate stars
      st.stars = Array.from(
        { length: Math.min(800, Math.floor((st.W * st.H) / 1400)) },
        () => ({
          x: Math.random() * st.W,
          y: Math.random() * st.H,
          z: 0.15 + Math.random() * 0.85,
          s: 0.35 + Math.random() * 1.8,
          a: 0.16 + Math.random() * 0.84,
        })
      );
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Noise texture for surface detail ────────────────────
    const drawNoiseTexture = (cx, cy, r, seed) => {
      ctx.save();
      ctx.globalAlpha = 0.15;
      const count = Math.min(180, Math.max(55, Math.round(r * 2)));
      for (let i = 0; i < count; i++) {
        const a = ((i * 12.9898 + seed) % 6.283);
        const rr = r * Math.sqrt(((i * 37 + seed) % 101) / 101);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        ctx.fillStyle = i % 3 === 0 ? "#fff" : "#07122d";
        ctx.beginPath();
        ctx.arc(x, y, 0.35 + (i % 4) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // ── Draw a single planet ────────────────────────────────
    const drawPlanet = (p, q, depth) => {
      const r = p.size * (0.72 + Math.min(depth, 0.9) * 0.18);
      const spin = q.rotation;
      const tilt = p.tilt || 0;

      // Outer atmosphere halo
      const halo = ctx.createRadialGradient(q.x, q.y, r * 0.15, q.x, q.y, r * 3.2);
      halo.addColorStop(0, rgba(p.color, 0.25));
      halo.addColorStop(0.35, rgba(p.color, 0.12));
      halo.addColorStop(1, rgba(p.color, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Body with directional lighting
      const lightX = q.x - r * 0.42;
      const lightY = q.y - r * 0.55;
      const g = ctx.createRadialGradient(lightX, lightY, r * 0.03, q.x + r * 0.12, q.y + r * 0.12, r * 1.22);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.07, rgba(p.color, 0.98));
      g.addColorStop(0.34, rgba(p.color, 0.92));
      g.addColorStop(0.72, rgba(p.color, 0.48));
      g.addColorStop(1, "#020612");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Material-specific surface detail
      ctx.save();
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 0.98, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(q.x, q.y);
      ctx.rotate(tilt);
      ctx.translate(-q.x, -q.y);
      ctx.globalAlpha = 0.92;

      // Rotating bands
      for (let b = 0; b < 4; b++) {
        const bandY = q.y - r * 0.62 + b * r * 0.42 + Math.sin(spin * 0.8 + b) * r * 0.07;
        ctx.strokeStyle = rgba("#ffffff", 0.045 + (b % 2) * 0.025);
        ctx.lineWidth = Math.max(1, r * 0.035);
        ctx.beginPath();
        ctx.ellipse(q.x, bandY, r * (0.72 + 0.06 * Math.sin(spin + b)), r * 0.10, spin * 0.16 + b * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Material-specific patterns
      if (p.mat === "glass") {
        for (let i = 0; i < 8; i++) { ctx.strokeStyle = rgba("#d9f4ff", 0.11); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x - r * 0.8 + i * r * 0.28, q.y + r * 0.15, r * (0.45 + i * 0.04), -1.4, 0.65); ctx.stroke(); }
      } else if (p.mat === "crystal") {
        for (let i = 0; i < 7; i++) { ctx.strokeStyle = rgba("#fff", 0.16); ctx.beginPath(); ctx.moveTo(q.x - r, q.y - r * 0.7 + i * r * 0.25); ctx.lineTo(q.x + r * 0.8, q.y - r * 0.1 + i * r * 0.23); ctx.stroke(); }
      } else if (p.mat === "metal") {
        for (let i = 0; i < 9; i++) { ctx.strokeStyle = rgba("#dce6ff", 0.08); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, r * (0.25 + i * 0.08), 0.2, 2.6); ctx.stroke(); }
      } else if (p.mat === "energy") {
        for (let i = 0; i < 6; i++) { ctx.strokeStyle = rgba("#fff", 0.17); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(q.x - r * 0.8, q.y - r * 0.2 + i * r * 0.15); ctx.quadraticCurveTo(q.x, q.y + r * 0.45, q.x + r * 0.8, q.y - r * 0.1 + i * r * 0.12); ctx.stroke(); }
      } else if (p.mat === "bio") {
        for (let i = 0; i < 5; i++) { ctx.strokeStyle = rgba("#d8fff6", 0.17); ctx.beginPath(); ctx.arc(q.x + r * 0.1, q.y - r * 0.05, r * (0.2 + i * 0.1), i * 0.8, i * 0.8 + 1.9); ctx.stroke(); }
      } else if (p.mat === "data") {
        for (let i = 0; i < 6; i++) { ctx.fillStyle = rgba("#fff", 0.14); ctx.fillRect(q.x - r * 0.65 + i * r * 0.23, q.y - r * 0.45, r * 0.08, r * 0.9); }
      } else if (p.mat === "cloud") {
        for (let i = 0; i < 7; i++) { ctx.fillStyle = rgba("#fff", 0.08); ctx.beginPath(); ctx.ellipse(q.x - r * 0.45 + i * r * 0.14, q.y - r * 0.1 + (i % 2) * r * 0.1, r * 0.3, r * 0.16, 0, 0, Math.PI * 2); ctx.fill(); }
      }

      // Rotating noise texture
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(spin * 0.55);
      ctx.translate(-q.x, -q.y);
      drawNoiseTexture(q.x, q.y, r, PLANETS.indexOf(p) * 19 + 7);
      ctx.restore();
      ctx.restore();

      // Rim light
      ctx.strokeStyle = rgba("#bfe9ff", 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 0.97, -2.35, 0.5);
      ctx.stroke();

      // Icon plate
      const plate = r * 0.56;
      ctx.fillStyle = "rgba(1,5,17,.48)";
      ctx.strokeStyle = rgba("#fff", 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(q.x, q.y, plate, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${Math.max(8, r * 0.28)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.icon, q.x, q.y);

      // Depth label
      ctx.textBaseline = "alphabetic";
      ctx.font = "700 10px system-ui";
      ctx.fillStyle = "rgba(235,241,255,.9)";
      ctx.fillText(p.tag, q.x, q.y + r + 17);
    };

    // ── Main draw loop ──────────────────────────────────────
    const draw = () => {
      const reduced = reducedRef.current;
      st.t += reduced ? 0 : 0.008;
      st.simTime += reduced ? 0 : 0.0038;

      ctx.clearRect(0, 0, st.W, st.H);

      // Background glow
      const bg = ctx.createRadialGradient(st.W / 2, st.H / 2, 10, st.W / 2, st.H / 2, Math.min(st.W, st.H) * 0.62);
      bg.addColorStop(0, "rgba(74,62,180,.17)");
      bg.addColorStop(0.45, "rgba(14,40,105,.07)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, st.W, st.H);

      // Stars
      for (const s of st.stars) {
        s.x += reduced ? 0 : 0.035 * s.s;
        if (s.x > st.W) s.x = 0;
        ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(st.t * 2 + s.x));
        ctx.fillStyle = s.z > 0.72 ? "#dff5ff" : "#8ea7d8";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.s * (0.6 + s.z), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const core = { x: st.W / 2 + st.panX, y: st.H / 2 + st.panY };

      // Galaxy rings
      for (let r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.ellipse(core.x, core.y, Math.min(st.W, st.H) * (0.20 + r * 0.105) * st.scale, Math.min(st.W, st.H) * (0.07 + r * 0.027) * st.scale, -0.28 + r * 0.17, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(92,132,255,${0.14 - r * 0.025})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Distant nebula ribbons
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(-0.28);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.min(st.W, st.H) * (0.44 + i * 0.08) * st.scale, Math.min(st.W, st.H) * (0.10 + i * 0.018) * st.scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(102,75,255,${0.045 - i * 0.008})`;
        ctx.lineWidth = 18 - i * 4;
        ctx.stroke();
      }
      ctx.restore();

      // Planet connections + planets
      PLANETS.forEach((p, i) => {
        const q = worldPos(p, i, st);
        const distance = Math.hypot(q.x - core.x, q.y - core.y);
        ctx.beginPath();
        ctx.moveTo(core.x, core.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = distance < Math.min(st.W, st.H) * 0.5 ? "rgba(98,131,235,.09)" : "rgba(98,131,235,.035)";
        ctx.stroke();
        drawPlanet(p, q, st.scale);
      });

      // Orbital tracks
      if (st.orbit) {
        PLANETS.forEach((p, i) => {
          const depth = Math.min(st.W, st.H) * 0.72 * st.scale;
          const radius = Math.hypot(p.x, p.y) * (p.orbit || 1) * depth;
          const base = Math.atan2(p.y, p.x);
          ctx.save();
          ctx.translate(core.x, core.y);
          ctx.rotate(base);
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * 0.72, 0, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(p.color, 0.075);
          ctx.lineWidth = 1;
          ctx.stroke();
          // Tiny moving orbital marker
          const a = st.simTime * (p.speed || 0.1);
          const mx = Math.cos(a) * radius;
          const my = Math.sin(a) * radius * 0.72;
          ctx.fillStyle = rgba(p.color, 0.22);
          ctx.beginPath();
          ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Central Chromolog world
      const R = 74 * st.scale;
      const cg = ctx.createRadialGradient(core.x - R * 0.35, core.y - R * 0.45, 3, core.x, core.y, R * 1.35);
      cg.addColorStop(0, "#fff");
      cg.addColorStop(0.08, "#79d9ff");
      cg.addColorStop(0.28, "#397dff");
      cg.addColorStop(0.52, "#5648ff");
      cg.addColorStop(0.76, "#8d3dff");
      cg.addColorStop(1, "rgba(50,24,170,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(core.x, core.y, R * 1.3, 0, 7);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(core.x, core.y, R, 0, 7);
      ctx.clip();
      
      const coreBg = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, R);
      coreBg.addColorStop(0, "#161b3d");
      coreBg.addColorStop(0.65, "#0b0f26");
      coreBg.addColorStop(1, "#040612");
      ctx.fillStyle = coreBg;
      ctx.fill();

      for (let i = 0; i < 11; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + (i % 3) * 0.025})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(core.x, core.y, R * (0.25 + i * 0.07), i * 0.6, i * 0.6 + 1.5);
        ctx.stroke();
      }
      drawNoiseTexture(core.x, core.y, R, 91);

      // Render Chromolog Logo image inside the center of the planet
      if (logoLoaded || (logoImg.complete && logoImg.naturalWidth > 0)) {
        ctx.save();
        const pulse = 1 + Math.sin(st.t * 1.5) * 0.035;
        const logoSize = R * 1.35 * pulse;
        
        // Soft glowing aura behind logo
        const logoGlow = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, logoSize * 0.55);
        logoGlow.addColorStop(0, "rgba(120, 210, 255, 0.45)");
        logoGlow.addColorStop(1, "rgba(120, 210, 255, 0)");
        ctx.fillStyle = logoGlow;
        ctx.beginPath();
        ctx.arc(core.x, core.y, logoSize * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(
          logoImg,
          core.x - logoSize / 2,
          core.y - logoSize / 2,
          logoSize,
          logoSize
        );
        ctx.restore();
      }

      ctx.restore();

      // Rotating rim light on core
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(st.simTime * 0.22);
      ctx.translate(-core.x, -core.y);
      ctx.strokeStyle = "rgba(190,225,255,.38)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(core.x, core.y, R * 0.98, -2.4, 0.6);
      ctx.stroke();
      ctx.strokeStyle = "rgba(130,180,255,.22)";
      ctx.beginPath();
      ctx.arc(core.x, core.y, R * 0.76, 0.35, 3.1);
      ctx.stroke();
      ctx.restore();

      // Core label
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.max(10, 13 * st.scale)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("CHROMOLOG", core.x, core.y + R + 28);
      ctx.font = "700 9px system-ui";
      ctx.fillStyle = "rgba(180,207,255,.78)";
      ctx.fillText("TECHNOLOGY CORE", core.x, core.y + R + 43);

      st.animId = requestAnimationFrame(draw);
    };

    // ── Event handlers ──────────────────────────────────────
    let downX = 0;
    let downY = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      st.drag = true;
      downX = e.clientX;
      downY = e.clientY;
      hasMoved = false;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (st.drag) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
          hasMoved = true;
        }
        st.panX += e.clientX - st.lastX;
        st.panY += e.clientY - st.lastY;
        st.lastX = e.clientX;
        st.lastY = e.clientY;
      } else {
        // Hover cursor check
        let isOverPlanet = false;
        PLANETS.forEach((p, i) => {
          const q = worldPos(p, i, st);
          const d = Math.hypot(mx - q.x, my - q.y);
          if (d < Math.max(p.size * 2.8, 38)) {
            isOverPlanet = true;
          }
        });
        canvas.style.cursor = isOverPlanet ? "pointer" : "grab";
      }
    };

    const onPointerUp = () => {
      st.drag = false;
    };

    const zoom = (f) => {
      st.scale = Math.max(0.48, Math.min(2.4, st.scale * f));
    };
    const onWheel = (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.10 : 0.90);
    };

    const distanceTouches = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        st.pinchStart = distanceTouches(e.touches[0], e.touches[1]);
        st.pinchScale = st.scale;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        const d = distanceTouches(e.touches[0], e.touches[1]);
        if (st.pinchStart > 0) {
          st.scale = Math.max(0.48, Math.min(2.4, st.pinchScale * (d / st.pinchStart)));
        }
      }
    };
    const onTouchEnd = () => { st.pinchStart = 0; };

    const onClick = (e) => {
      if (hasMoved) return; // If user dragged/panned, don't trigger planet click
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let hit = null;
      let dist = 9999;
      PLANETS.forEach((p, i) => {
        const q = worldPos(p, i, st);
        const d = Math.hypot(mx - q.x, my - q.y);
        const hitRadius = Math.max(p.size * 2.8, 38);
        if (d < hitRadius && d < dist) {
          hit = p;
          dist = d;
        }
      });
      if (hit) {
        setModal(hit);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("click", onClick);

    // Start animation
    st.animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(st.animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("click", onClick);
    };
  }, [worldPos]);

  // ── Zoom/orbit control handlers ───────────────────────────
  const handleZoomIn = useCallback(() => {
    stateRef.current.scale = Math.max(0.48, Math.min(2.4, stateRef.current.scale * 1.22));
  }, []);
  const handleZoomOut = useCallback(() => {
    stateRef.current.scale = Math.max(0.48, Math.min(2.4, stateRef.current.scale * 0.82));
  }, []);
  const handleReset = useCallback(() => {
    stateRef.current.scale = 1;
    stateRef.current.panX = 0;
    stateRef.current.panY = 0;
  }, []);
  const handleOrbitToggle = useCallback(() => {
    stateRef.current.orbit = !stateRef.current.orbit;
  }, []);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 380 }}>
      {/* Galaxy canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          touchAction: "none",
          cursor: "grab",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle, transparent 42%, rgba(0,0,0,.52) 100%)",
        }}
      />



      {/* Planet detail modal — Rendered at document.body via Portal to overlay the entire home page */}
      {modal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(3, 7, 18, 0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: 24,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "min(640px, 92vw)",
              maxHeight: "85vh",
              overflowY: "auto",
              border: "1px solid rgba(84, 180, 255, 0.35)",
              borderRadius: 24,
              background: "linear-gradient(145deg, rgba(12, 17, 43, 0.96), rgba(4, 7, 20, 0.98))",
              padding: "36px 32px",
              boxShadow: "0 30px 100px rgba(0, 0, 0, 0.8), 0 0 40px rgba(53, 170, 255, 0.15)",
              color: "#f7f8ff",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            <button
              onClick={() => setModal(null)}
              style={{
                position: "absolute",
                right: 20,
                top: 20,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
            >
              ✕
            </button>
            <p style={{ color: "#38bdf8", fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 800, marginBottom: 12 }}>
              {modal.tag} · CHROMOLOG TECHNOLOGIES
            </p>
            <h2 style={{ fontSize: 32, margin: "0 0 16px", letterSpacing: -1, fontWeight: 800, color: "#ffffff" }}>
              {modal.name}
            </h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: 15, marginBottom: 24 }}>
              {modal.text}
            </p>
            <ul style={{ paddingLeft: 20, color: "#e2e8f0", lineHeight: 1.8, margin: 0, fontSize: 14 }}>
              {modal.list.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
