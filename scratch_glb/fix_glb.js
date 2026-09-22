const { NodeIO } = require('@gltf-transform/core');

async function run() {
  const io = new NodeIO();
  const document = await io.read('./chromolog_logo_3d.glb');
  const materials = document.getRoot().listMaterials();
  
  // Fix Material 0 (Body with vertex colors)
  if (materials[0]) {
    materials[0].setName('Chromolog_Indigo');
    materials[0].setBaseColorFactor([1.0, 1.0, 1.0, 1.0]); // White to let vertex colors show through
    materials[0].setMetallicFactor(0.2);
    materials[0].setRoughnessFactor(0.25);
    materials[0].setAlphaMode('OPAQUE');
  }

  // Fix Material 1 (Front face without vertex colors)
  if (materials[1]) {
    materials[1].setName('Chromolog_Blue');
    materials[1].setBaseColorFactor([0.0, 0.6, 1.0, 1.0]); // Bright cyan/blue
    materials[1].setMetallicFactor(0.15);
    materials[1].setRoughnessFactor(0.2);
    materials[1].setAlphaMode('OPAQUE');
  }

  await io.write('./chromolog_logo_3d_fixed.glb', document);
}
run();
