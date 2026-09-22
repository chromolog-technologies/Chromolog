const { NodeIO } = require('@gltf-transform/core');

async function run() {
  const io = new NodeIO();
  const document = await io.read('./chromolog_logo_3d.glb');
  const materials = document.getRoot().listMaterials();
  materials.forEach((mat, i) => {
    console.log(`Material ${i}: ${mat.getName()}`);
    console.log(`  BaseColorFactor: ${mat.getBaseColorFactor()}`);
    console.log(`  MetallicFactor: ${mat.getMetallicFactor()}`);
    console.log(`  RoughnessFactor: ${mat.getRoughnessFactor()}`);
    console.log(`  AlphaMode: ${mat.getAlphaMode()}`);
  });
}
run();
