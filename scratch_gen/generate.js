const fs = require('fs');
const { JSDOM } = require('jsdom');

// Setup minimal DOM for GLTFExporter
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.Blob = dom.window.Blob;
global.FileReader = dom.window.FileReader;

const THREE = require('three');
// Load GLTFExporter
require('three/examples/jsm/exporters/GLTFExporter.js');

function createRibbon(curvePoints, widthFn, thicknessFn, colorFn) {
    const curve = new THREE.CatmullRomCurve3(
        curvePoints.map(p => new THREE.Vector3(...p)),
        false, 'chordal'
    );

    const tubularSegments = 128;
    const radialSegments = 32;

    const vertices = [];
    const indices = [];
    const normals = [];
    const colors = [];

    const UP = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const pt = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u).normalize();
        
        // Compute frame
        const normal = new THREE.Vector3().crossVectors(tangent, UP).normalize();
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        const w = widthFn(u);
        const t = thicknessFn(u);
        const baseColor = colorFn(u);

        for (let j = 0; j <= radialSegments; j++) {
            const v = j / radialSegments;
            const theta = v * Math.PI * 2;
            
            const cx = Math.cos(theta);
            const cy = Math.sin(theta);
            
            const dx = cx * w;
            const dy = cy * t;
            
            const vertex = new THREE.Vector3()
                .copy(pt)
                .addScaledVector(normal, dx)
                .addScaledVector(binormal, dy);
                
            vertices.push(vertex.x, vertex.y, vertex.z);
            
            // Compute normal (approximate for ellipse)
            const nx = cx / w;
            const ny = cy / t;
            const nLen = Math.sqrt(nx*nx + ny*ny);
            const surfNormal = new THREE.Vector3()
                .addScaledVector(normal, nx / nLen)
                .addScaledVector(binormal, ny / nLen)
                .normalize();
                
            normals.push(surfNormal.x, surfNormal.y, surfNormal.z);
            
            // Gradient slightly darker on the back/edges
            const lightness = Math.max(0.3, Math.pow(Math.max(0, cy), 0.5));
            const r = Math.min(1.0, baseColor.r * lightness + (cx > 0 ? 0.1 : 0));
            const g = Math.min(1.0, baseColor.g * lightness + (cx > 0 ? 0.1 : 0));
            const b = Math.min(1.0, baseColor.b * lightness + (cx > 0 ? 0.1 : 0));
            
            colors.push(r, g, b);
        }
    }

    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = a + radialSegments + 1;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    
    return geometry;
}

// 1. Blue Ribbon
const bluePoints = [
    [-0.1, -0.85, 0.05],
    [-0.75, -0.3, 0.02],
    [-0.8, 0.4, 0.0],
    [-0.2, 0.85, -0.02],
    [0.7, 0.75, -0.05]
];
const blueW = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.8);
    return 0.01 + 0.30 * falloff;
};
const blueT = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.5);
    return 0.01 + 0.15 * falloff;
};
const blueColor = (u) => {
    const cDeep = new THREE.Color(0x0044ff);
    const cMid = new THREE.Color(0x0088ff);
    const cCyan = new THREE.Color(0x00e5ff);
    if (u < 0.5) return cDeep.clone().lerp(cMid, u * 2);
    return cMid.clone().lerp(cCyan, (u - 0.5) * 2);
};

// 2. Purple Ribbon
const purplePoints = [
    [0.65, -0.65, 0.05],
    [0.15, -0.85, 0.03],
    [-0.45, -0.5, 0.01],
    [-0.5, 0.1, -0.02]
];
const purpleW = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.7);
    return 0.01 + 0.28 * falloff;
};
const purpleT = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.5);
    return 0.01 + 0.14 * falloff;
};
const purpleColor = (u) => {
    const cLav = new THREE.Color(0x8a2be2);
    const cPurp = new THREE.Color(0x6a0dad);
    return cLav.clone().lerp(cPurp, u);
};

// 3. Indigo Ribbon (Connector behind)
const indigoPoints = [
    [-0.5, -0.6, -0.1],
    [-0.65, 0.0, -0.12],
    [-0.4, 0.6, -0.15],
    [0.2, 0.65, -0.15]
];
const indigoW = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.5);
    return 0.01 + 0.22 * falloff;
};
const indigoT = (u) => {
    const falloff = Math.pow(Math.sin(u * Math.PI), 0.5);
    return 0.01 + 0.10 * falloff;
};
const indigoColor = (u) => {
    return new THREE.Color(0x220b46); 
};

const scene = new THREE.Scene();

const matSettings = {
    vertexColors: true,
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1
};
const material = new THREE.MeshPhysicalMaterial(matSettings);

const blueGeo = createRibbon(bluePoints, blueW, blueT, blueColor);
const blueMesh = new THREE.Mesh(blueGeo, material.clone());
blueMesh.name = "Chromolog_Blue";
scene.add(blueMesh);

const purpleGeo = createRibbon(purplePoints, purpleW, purpleT, purpleColor);
const purpleMesh = new THREE.Mesh(purpleGeo, material.clone());
purpleMesh.name = "Chromolog_Purple";
scene.add(purpleMesh);

const indigoGeo = createRibbon(indigoPoints, indigoW, indigoT, indigoColor);
const indigoMesh = new THREE.Mesh(indigoGeo, material.clone());
indigoMesh.name = "Chromolog_Indigo";
scene.add(indigoMesh);

const box = new THREE.Box3().setFromObject(scene);
const center = box.getCenter(new THREE.Vector3());
scene.position.sub(center);

const group = new THREE.Group();
group.add(scene);

const exporter = new THREE.GLTFExporter();
exporter.parse(group, function (gltf) {
    const buffer = Buffer.from(gltf);
    fs.writeFileSync('Chromolog_logo_3d_new.glb', buffer);
    console.log("Successfully exported Chromolog_logo_3d_new.glb!");
}, function (error) {
    console.error('An error happened during parsing:', error);
}, { binary: true });
