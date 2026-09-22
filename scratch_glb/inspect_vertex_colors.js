const { NodeIO } = require('@gltf-transform/core');

async function run() {
  const io = new NodeIO();
  const document = await io.read('./chromolog_logo_3d.glb');
  const meshes = document.getRoot().listMeshes();
  meshes.forEach((mesh, i) => {
    mesh.listPrimitives().forEach((prim, j) => {
      const colorAcc = prim.getAttribute('COLOR_0');
      console.log(`Mesh ${i} Primitive ${j}: Has COLOR_0 -> ${!!colorAcc}`);
    });
  });
}
run();
