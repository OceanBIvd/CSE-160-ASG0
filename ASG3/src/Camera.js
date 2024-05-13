class Camera {
    constructor(canvas) {
        this.fov = 120;
        this.eye = new Vector3([-15, 3, 1]);
        this.at = new Vector3([0, 1, 0]);
        this.up = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );

        this.projectionMatrix.setPerspective(
            this.fov, canvas.width / canvas.height, 0.1, 1000
        );
    }

    moveForward(speed) {
        let f = new Vector3();
        f.set(this.at).sub(this.eye).normalize().mul(speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateViewMatrix();
    }

    moveBackward(speed) {
        let b = new Vector3();
        b.set(this.eye).sub(this.at).normalize().mul(speed);
        this.eye.add(b);
        this.at.add(b);
        this.updateViewMatrix();
    }

    moveLeft(speed) {
        let f = new Vector3();
        f.set(this.at).sub(this.eye).normalize();
        let s = Vector3.cross(this.up, f).normalize().mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    moveRight(speed) {
        let f = new Vector3();
        f.set(this.at).sub(this.eye).normalize();
        let s = Vector3.cross(f, this.up).normalize().mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    panLeft(alpha) {
        let f = new Vector3();
        f.set(this.at).sub(this.eye).normalize();
        let rotationMatrix = new Matrix4().setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3(this.eye.elements).add(f_prime);
        this.updateViewMatrix();
    }

    panRight(alpha) {
        this.panLeft(-alpha);
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
}
