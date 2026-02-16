class Camera {
  constructor(canvas, fov = 60) {
    this.fov = fov;
    this.eye = new Vector3([0, 1.0, 0]);
    this.at = new Vector3([0, 1.0, -1]);
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );

    this.projectionMatrix = new Matrix4();
    const aspect = canvas.width / canvas.height;
    this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000.0);
  }

  moveForward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    f.mul(0.1);
    this.eye.add(f);
    this.at.add(f);
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);
    b.normalize();
    b.mul(0.1);
    this.eye.add(b);
    this.at.add(b);
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );
  }

  moveLeft() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let s = new Vector3();
    s.set(this.up);
    s = Vector3.cross(s, f);
    s.normalize();
    s.mul(0.1);
    this.eye.add(s);
    this.at.add(s);
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );
  }

  moveRight() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let s = new Vector3();
    s.set(f);
    s = Vector3.cross(s, this.up);
    s.normalize();
    s.mul(0.1);
    this.eye.add(s);
    this.at.add(s);
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );
  }

  panLeft(alpha = 5) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    let rotMatrix = new Matrix4();
    rotMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    let f_prime = rotMatrix.multiplyVector3(f);
    let newAt = new Vector3();
    newAt.set(this.eye);
    newAt.add(f_prime);
    this.at.set(newAt);
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2],
    );
  }

  panRight(alpha = 5) {
    this.panLeft(-alpha);
  }
}