import * as THREE from 'three';

export class ThreeCube {
  constructor(scene) {
    this.color = [1, 1, 1, 1];

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(1, 1, 1),
      transparent: true,
      opacity: 1.0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setScale(x, y, z) {
    this.mesh.scale.set(x, y, z);
  }

  setColor(r, g, b, a = 1.0) {
    this.color = [r, g, b, a];
    this.mesh.material.color.setRGB(r, g, b);
    this.mesh.material.opacity = a;
  }

  setTexture(url, repeatX = 1, repeatY = 1) {
    const loader = new THREE.TextureLoader();
    loader.load(url, texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      this.mesh.material.map = texture;
      this.mesh.material.needsUpdate = true;
    });
  }
}
