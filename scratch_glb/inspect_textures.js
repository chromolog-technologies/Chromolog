const { NodeIO } = require('@gltf-transform/core');

async function run() {
  const io = new NodeIO();
  const document = await io.read('./chromolog_logo_3d.glb');
  const materials = document.getRoot().listMaterials();
  materials.forEach((mat, i) => {
    console.log(`Material ${i}: ${mat.getName()}`);
    const baseColorTextureInfo = mat.getBaseColorTextureInfo();
    const baseColorTexture = mat.getBaseColorTexture();
    if (baseColorTexture) {
      console.log(`  Has BaseColor Texture: Yes`);
    } else {
      console.log(`  Has BaseColor Texture: No`);
    }
  });
}
run();
