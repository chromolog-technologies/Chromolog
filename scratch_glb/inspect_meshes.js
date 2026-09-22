const { NodeIO } = require('@gltf-transform/core');

async function run() {
  const io = new NodeIO();
  const document = await io.read('./chromolog_logo_3d.glb');
  const meshes = document.getRoot().listMeshes();
  meshes.forEach((mesh, i) => {
    console.log(`Mesh ${i}: ${mesh.getName()}`);
    mesh.listPrimitives().forEach((prim, j) => {
      const mat = prim.getMaterial();
      console.log(`  Primitive ${j}: Material -> ${mat ? mat.getName() : 'none'}`);
    });
  });
}
run();
