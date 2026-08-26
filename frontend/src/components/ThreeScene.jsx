import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallViewport = window.innerWidth < 768;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050816, 0.12);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSmallViewport,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallViewport ? 1.35 : 1.75));
    renderer.setSize(width, height);
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // Helper to generate a glowing dot texture
    const createCircleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");

      // Draw radial gradient
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(0, 229, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(79, 70, 229, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const particleTexture = createCircleTexture();

    // 4. Create particle network sphere
    const particleCount = isSmallViewport ? 72 : 120;
    const sphereRadius = 3.2;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particlesData = [];

    const colorPrimary = new THREE.Color("#4f46e5");
    const colorSecondary = new THREE.Color("#00e5ff");
    const colorPurple = new THREE.Color("#7c3aed");

    for (let i = 0; i < particleCount; i++) {
      // Golden ratio spacing on a sphere surface for uniform distribution
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Assign gradient colors based on coordinates
      const colorMix = (y + sphereRadius) / (sphereRadius * 2);
      const tempColor = colorPrimary.clone().lerp(colorSecondary, colorMix);
      if (Math.random() > 0.7) tempColor.lerp(colorPurple, 0.5);

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      // Add velocity for slight organic oscillations
      particlesData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        originalPos: new THREE.Vector3(x, y, z),
        oscillationSpeed: 0.5 + Math.random() * 1.5,
        oscillationRange: 0.1 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.4,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(pointCloud);

    // 5. Connection lines segments setup
    const maxConnections = particleCount * (isSmallViewport ? 3 : 4);
    const linePositions = new Float32Array(maxConnections * 3 * 2);
    const lineColors = new Float32Array(maxConnections * 3 * 2);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00e5ff, 4, 15);
    cyanLight.position.set(4, 4, 4);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x7c3aed, 4, 15);
    purpleLight.position.set(-4, -4, 4);
    scene.add(purpleLight);

    // 7. Mouse Interactivity Variables
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left - rect.width / 2;
      const clientY = e.clientY - rect.top - rect.height / 2;

      // Map coordinates from -1 to 1
      mouse.targetX = clientX / (rect.width / 2);
      mouse.targetY = clientY / (rect.height / 2);
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // 8. Animation & Render loop
    const animationStart = performance.now();
    let animId;
    let paused = false; // tab hidden or scrolled offscreen

    const animate = () => {
      if (paused) { animId = 0; return; }
      animId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - animationStart) / 1000;
      const positionsAttr = pointCloud.geometry.attributes.position;
      const linesPositionsAttr = linesMesh.geometry.attributes.position;
      const linesColorsAttr = linesMesh.geometry.attributes.color;

      // Rotate sphere group slowly
      pointCloud.rotation.y = prefersReducedMotion ? 0.2 : elapsedTime * 0.08;
      pointCloud.rotation.x = prefersReducedMotion ? 0.1 : elapsedTime * 0.04;
      linesMesh.rotation.y = pointCloud.rotation.y;
      linesMesh.rotation.x = pointCloud.rotation.x;

      // Mouse Parallax Lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = prefersReducedMotion ? 0 : mouse.x * 1.5;
      camera.position.y = prefersReducedMotion ? 0 : -mouse.y * 1.5;
      camera.lookAt(0, 0, 0);

      // Oscillate particles organically on their sphere seats
      for (let i = 0; i < particleCount; i++) {
        const data = particlesData[i];
        const original = data.originalPos;

        // Spherical offset oscillation
        const offset = prefersReducedMotion
          ? 0
          : Math.sin(elapsedTime * data.oscillationSpeed + data.phase) * data.oscillationRange;
        
        // Push particle coordinate outward / inward along normal vector
        const normal = original.clone().normalize();
        const newPos = original.clone().add(normal.multiplyScalar(offset));

        positionsAttr.setXYZ(i, newPos.x, newPos.y, newPos.z);
      }
      positionsAttr.needsUpdate = true;

      // Rebuild connecting lines based on distance
      let vertexIdx = 0;
      let colorIdx = 0;
      let lineCount = 0;

      for (let i = 0; i < particleCount; i++) {
        const p1X = positionsAttr.getX(i);
        const p1Y = positionsAttr.getY(i);
        const p1Z = positionsAttr.getZ(i);

        for (let j = i + 1; j < particleCount; j++) {
          const p2X = positionsAttr.getX(j);
          const p2Y = positionsAttr.getY(j);
          const p2Z = positionsAttr.getZ(j);

          const dx = p1X - p2X;
          const dy = p1Y - p2Y;
          const dz = p1Z - p2Z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Max distance threshold for nodes connectivity
          if (dist < 1.6 && lineCount < maxConnections) {
            // Set position vectors
            linePositions[vertexIdx++] = p1X;
            linePositions[vertexIdx++] = p1Y;
            linePositions[vertexIdx++] = p1Z;
            linePositions[vertexIdx++] = p2X;
            linePositions[vertexIdx++] = p2Y;
            linePositions[vertexIdx++] = p2Z;

            // Set color and fade based on distance
            const alpha = 1.0 - dist / 1.6;
            
            const c1R = colors[i * 3];
            const c1G = colors[i * 3 + 1];
            const c1B = colors[i * 3 + 2];
            
            const c2R = colors[j * 3];
            const c2G = colors[j * 3 + 1];
            const c2B = colors[j * 3 + 2];

            lineColors[colorIdx++] = c1R * alpha * 0.45;
            lineColors[colorIdx++] = c1G * alpha * 0.45;
            lineColors[colorIdx++] = c1B * alpha * 0.45;
            lineColors[colorIdx++] = c2R * alpha * 0.45;
            lineColors[colorIdx++] = c2G * alpha * 0.45;
            lineColors[colorIdx++] = c2B * alpha * 0.45;

            lineCount++;
          }
        }
      }

      // Draw active lines
      linesPositionsAttr.needsUpdate = true;
      linesColorsAttr.needsUpdate = true;
      linesMesh.geometry.setDrawRange(0, lineCount * 2);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Pause when tab inactive or scene scrolled offscreen (performance)
    let inView = true;
    const syncPaused = () => {
      const shouldPause = document.hidden || !inView;
      if (shouldPause === paused) return;
      paused = shouldPause;
      if (!paused && !animId) animate();
    };
    const onVisibility = () => syncPaused();
    const io = new IntersectionObserver(
      ([entry]) => { inView = entry.isIntersecting; syncPaused(); },
      { threshold: 0.01 }
    );
    io.observe(container);
    document.addEventListener("visibilitychange", onVisibility);

    // 10. Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 10. Clean up
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      
      try {
        container.removeChild(renderer.domElement);
      } catch {
        // Safe check
      }

      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] md:min-h-[450px] relative pointer-events-none"
      aria-hidden="true"
    />
  );
}
