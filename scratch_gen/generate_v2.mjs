import fs from 'fs';
import { JSDOM } from 'jsdom';

// DOM polyfills for GLTFExporter
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Blob = dom.window.Blob;
global.FileReader = dom.window.FileReader;
global.self = dom.window;

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const DEG2RAD = Math.PI / 180;

/**
 * Creates a ribbon mesh swept along a circular arc with elliptical cross-section.
 * 
 * The ribbon lies in the XY plane with depth along Z.
 * - Width varies radially (perpendicular to the arc tangent, within XY)
 * - Thickness varies along Z
 * - Both taper smoothly to near-zero at the tips
 */
function createArcRibbon({
    radius,          // center radius of the arc
    startDeg,        // start angle in degrees (math convention: 0=right, CCW positive)
    endDeg,          // end angle (can be < start for clockwise sweep)
    maxHalfWidth,    // max radial half-width at the peak
    maxHalfThickness,// max depth half-thickness at the peak
    zOffset = 0,     // Z-depth offset for layering
    taperExp = 1.2,  // taper exponent (higher = sharper tips)
    colorStart,      // THREE.Color at t=0
    colorEnd,        // THREE.Color at t=1
    arcSegs = 256,   // segments along the arc
    crossSegs = 48   // segments around the cross-section ellipse
}) {
    const startRad = startDeg * DEG2RAD;
    const endRad = endDeg * DEG2RAD;

    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= arcSegs; i++) {
        const t = i / arcSegs;
        const angle = startRad + t * (endRad - startRad);

        // Smooth taper: 0 at both ends, 1 at center
        const taper = Math.pow(Math.sin(t * Math.PI), taperExp);

        const hw = 0.002 + maxHalfWidth * taper;   // half-width (radial)
        const ht = 0.002 + maxHalfThickness * taper; // half-thickness (Z)

        // Arc center point
        const px = radius * Math.cos(angle);
        const py = radius * Math.sin(angle);
        const pz = zOffset;

        // Radial outward direction
        const rx = Math.cos(angle);
        const ry = Math.sin(angle);

        // Color gradient along arc
        const col = colorStart.clone().lerp(colorEnd, t);

        for (let j = 0; j <= crossSegs; j++) {
            const v = j / crossSegs;
            const alpha = v * Math.PI * 2;

            const ca = Math.cos(alpha); // radial component
            const sa = Math.sin(alpha); // depth component

            // Vertex on elliptical cross-section
            positions.push(
                px + rx * ca * hw,
                py + ry * ca * hw,
                pz + sa * ht
            );

            // Analytical surface normal for ellipse
            const nRad = ca / (hw * hw);
            const nZ = sa / (ht * ht);
            const nLen = Math.sqrt(nRad * nRad + nZ * nZ) || 1;
            normals.push(rx * nRad / nLen, ry * nRad / nLen, nZ / nLen);

            // UV coordinates
            uvs.push(t, v);

            // Vertex color
            colors.push(col.r, col.g, col.b);
        }
    }

    // Triangle indices
    for (let i = 0; i < arcSegs; i++) {
        for (let j = 0; j < crossSegs; j++) {
            const a = i * (crossSegs + 1) + j;
            const b = a + (crossSegs + 1);
            const c = a + 1;
            const d = b + 1;
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
}

// ============================================================
// SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
const rootGroup = new THREE.Group();
rootGroup.name = 'ChromologLogo';
scene.add(rootGroup);

// Base material: white color * vertex colors, glossy polymer finish
const baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.18,
    metalness: 0.08,
    side: THREE.DoubleSide  // visible from all angles during rotation
});

// ============================================================
// BLUE RIBBON — Outer dominant arc
// ============================================================
// Sweeps counter-clockwise from upper-right tip (~55°) around to lower-left (~255°)
// Radius: 0.65 (outer position), slightly forward in Z
const blueGeo = createArcRibbon({
    radius: 0.65,
    startDeg: 55,
    endDeg: 260,
    maxHalfWidth: 0.25,
    maxHalfThickness: 0.08,
    zOffset: 0.015,
    taperExp: 1.15,
    colorStart: new THREE.Color(0x00d4ff),  // bright cyan at upper tip
    colorEnd: new THREE.Color(0x1133cc),    // deep blue at lower end
    arcSegs: 256,
    crossSegs: 48
});
const blueMesh = new THREE.Mesh(blueGeo, baseMat.clone());
blueMesh.name = 'Chromolog_Blue';
rootGroup.add(blueMesh);

// ============================================================
// PURPLE RIBBON — Inner bottom arc
// ============================================================
// Sweeps clockwise from lower-right tip (~315°) through bottom/left to upper-left (~155°)
// endDeg < startDeg → clockwise sweep: 315° → 270° → 225° → 180° → 155°
const purpleGeo = createArcRibbon({
    radius: 0.48,
    startDeg: 315,
    endDeg: 155,
    maxHalfWidth: 0.22,
    maxHalfThickness: 0.07,
    zOffset: -0.005,
    taperExp: 1.0,
    colorStart: new THREE.Color(0xbb66ff),  // lavender at lower-right tip
    colorEnd: new THREE.Color(0x5500aa),    // deep purple at upper-left end
    arcSegs: 256,
    crossSegs: 48
});
const purpleMesh = new THREE.Mesh(purpleGeo, baseMat.clone());
purpleMesh.name = 'Chromolog_Purple';
rootGroup.add(purpleMesh);

// ============================================================
// INDIGO RIBBON — Recessed connector layer
// ============================================================
// Visible between blue and purple on the left side, sits behind both in Z
// Arc range covers the overlap zone
const indigoGeo = createArcRibbon({
    radius: 0.56,
    startDeg: 250,
    endDeg: 160,
    maxHalfWidth: 0.15,
    maxHalfThickness: 0.045,
    zOffset: -0.065,
    taperExp: 0.85,
    colorStart: new THREE.Color(0x2211aa),  // medium indigo
    colorEnd: new THREE.Color(0x180866),    // deep indigo
    arcSegs: 200,
    crossSegs: 40
});
const indigoMesh = new THREE.Mesh(indigoGeo, baseMat.clone());
indigoMesh.name = 'Chromolog_Indigo';
rootGroup.add(indigoMesh);

// ============================================================
// CENTER THE MODEL AT ORIGIN
// ============================================================
const bbox = new THREE.Box3().setFromObject(rootGroup);
const center = bbox.getCenter(new THREE.Vector3());
rootGroup.children.forEach(child => {
    child.position.sub(center);
});

// Print bounding info
const size = bbox.getSize(new THREE.Vector3());
console.log('Bounding box size:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3));
console.log('Center offset applied:', center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3));

// ============================================================
// EXPORT AS GLB
// ============================================================
const exporter = new GLTFExporter();
exporter.parse(
    scene,
    (glb) => {
        const buffer = Buffer.from(glb);
        fs.writeFileSync('Chromolog_logo_3d_v2.glb', buffer);
        console.log('✓ Exported Chromolog_logo_3d_v2.glb (' + (buffer.length / 1024).toFixed(1) + ' KB)');
        
        // Also copy directly to the frontend models dir
        fs.copyFileSync(
            'Chromolog_logo_3d_v2.glb',
            '../frontend/public/models/chronolog_logo_3d.glb'
        );
        console.log('✓ Copied to frontend/public/models/chronolog_logo_3d.glb');
    },
    (err) => { console.error('Export failed:', err); },
    { binary: true }
);
