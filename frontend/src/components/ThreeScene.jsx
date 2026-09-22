import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ThreeScene() {
  const mountRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasError(true);
        return;
      }
    } catch (e) {
      setHasError(true);
      return;
    }

    const container = mountRef.current;
    const scene = new THREE.Scene();
    
    // Initial camera position (will be updated dynamically once model loads)
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.innerWidth > 768,
      powerPreference: "high-performance",
    });
    // Limit pixel ratio to 2 for performance (1.5 preferred on mobile, but let's use devicePixelRatio capped at 2)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent canvas
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Premium Lighting Setup
    scene.add(new THREE.HemisphereLight(0x8fc7ff, 0x220b46, 1.8)); // Soft fill
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(3, 4, 5); // Upper-left/front
    scene.add(keyLight);
    
    const blueRimLight = new THREE.DirectionalLight(0x00aaff, 2.5);
    blueRimLight.position.set(-4, 1, -3); // Rear-left
    scene.add(blueRimLight);

    const purpleRimLight = new THREE.DirectionalLight(0x9d00ff, 2.5);
    purpleRimLight.position.set(4, 1, -3); // Rear-right
    scene.add(purpleRimLight);

    // Root Group for rotations and floating
    const root = new THREE.Group();
    scene.add(root);

    let model = null;
    const loader = new GLTFLoader();
    
    loader.load(
      '/models/chronolog_logo_3d.glb',
      (gltf) => {
        model = gltf.scene;
        
        // 1. Calculate bounding box of the raw model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // 2. Center the model (move pivot to true origin)
        model.position.sub(center);
        
        // 3. Normalize scale (fit into a reasonable unit box)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleTarget = 2.0 / maxDim;
        model.scale.setScalar(scaleTarget);

        // 4. Calculate bounding sphere of the scaled model
        const scaledBox = new THREE.Box3().setFromObject(model);
        const sphere = scaledBox.getBoundingSphere(new THREE.Sphere());
        
        // 5. Adjust Camera Distance based on bounding sphere + safety margin
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(sphere.radius / Math.sin(fov / 2));
        
        // Add safety margin so model occupies ~60-75% of canvas, avoiding clipping
        cameraDistance *= 1.45; 
        
        camera.position.set(0, 0, cameraDistance);
        camera.updateProjectionMatrix();

        root.add(model);
      },
      undefined,
      (err) => {
        console.error('GLB load failed:', err);
        setHasError(true);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false; 
    controls.target.set(0, 0, 0);

    const prefsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointerDown = false;
    let lastInteractionTime = Date.now();
    let floatTime = 0;

    controls.addEventListener('start', () => { pointerDown = true; });
    controls.addEventListener('end', () => { pointerDown = false; lastInteractionTime = Date.now(); });

    const mouse = new THREE.Vector2();
    const targetRotation = new THREE.Vector2();
    
    const onMouseMove = (event) => {
      if (pointerDown || prefsReducedMotion) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      // Max tilt: approx ±5 degrees (0.087 rad)
      targetRotation.x = mouse.y * 0.087;
      targetRotation.y = mouse.x * 0.087;
    };
    
    // Disable native touch scrolling only on this container to allow OrbitControls
    container.style.touchAction = 'none';
    container.addEventListener('mousemove', onMouseMove, { passive: true });

    const clock = new THREE.Clock();
    let animationFrameId;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta(); // Frame-rate independent time
      
      if (!prefsReducedMotion) {
        // Subtle floating movement (approx 5-8px equivalent)
        floatTime += delta * 1.5;
        root.position.y = Math.sin(floatTime) * 0.04;
        
        if (!pointerDown) {
          const timeSinceInteraction = Date.now() - lastInteractionTime;
          // Resume auto-rotation after 2 seconds idle
          if (timeSinceInteraction > 2000) {
            // One revolution (~360deg = 2*PI rad) every 18 seconds => 0.349 rad/s
            root.rotation.y += delta * 0.35; 
          }
          
          if (model) {
             // Subtle cursor parallax
             model.rotation.x += (targetRotation.x - model.rotation.x) * (delta * 3.0);
             model.rotation.z += (-targetRotation.y - model.rotation.z) * (delta * 3.0);
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] relative flex justify-center items-center pointer-events-none">
        <style>{`@keyframes spinY { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } } .animate-spin-y { animation: spinY 8s linear infinite; transform-style: preserve-3d; }`}</style>
        <img src="/images/chromolog logo transparent.png" alt="Chromolog 3D Logo" className="w-full max-w-[400px] object-contain animate-spin-y drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" />
      </div>
    );
  }

  return (
    // Z-index 0 ensures it stays behind floating UI cards which usually have z-10 or higher
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] relative flex justify-center items-center group z-0">
      {/* Soft Glow Background */}
      <div 
        className="absolute w-full h-full max-w-[150%] max-h-[150%] rounded-full pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(0,170,255,0.15) 0%, rgba(157,0,255,0.1) 40%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          zIndex: -1
        }}
      />
      {/* WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Chromolog Logo"
        role="img"
      />
    </div>
  );
}
