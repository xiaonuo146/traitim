import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Heart } from './heart.js';
import { AmbientParticles } from './background.js';

class Application {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.renderer = null;
        this.scene = null;
        this.camera = null;

        this.heart = null;
        this.ambient = null;

        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;

        this.clock = new THREE.Clock();
        this.accumulator = 0;
        this.fixedStep = 1 / 60;

        this.init();
    }

    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);

        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, width / height, 0.1, 100);
        this.updateCameraDistance();

        this.heart = new Heart();
        this.scene.add(this.heart.group);

        this.ambient = new AmbientParticles();
        this.scene.add(this.ambient.points);

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });

        this.animate();
    }

    updateCameraDistance() {
        const aspect = window.innerWidth / window.innerHeight;
        const baseZ = CONFIG.CAMERA.BASE_Z;

        if (aspect < 1) {
            this.baseCameraZ = baseZ / aspect;
        } else if (aspect < 1.4) {
            this.baseCameraZ = baseZ * (1.35 / aspect);
        } else {
            this.baseCameraZ = baseZ;
        }

        this.camera.position.z = this.baseCameraZ;
    }

    onMouseMove(e) {
        this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 1.5;
        this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 1.5;
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.targetMouseX = (touch.clientX / window.innerWidth - 0.5) * 1.5;
            this.targetMouseY = (touch.clientY / window.innerHeight - 0.5) * 1.5;
        }
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.updateCameraDistance();
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.05);
        this.accumulator += delta;

        while (this.accumulator >= this.fixedStep) {
            this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
            this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;

            if (this.heart) this.heart.update();
            if (this.ambient) this.ambient.update();

            this.accumulator -= this.fixedStep;
        }

        const baseZ = this.baseCameraZ ?? CONFIG.CAMERA.BASE_Z;
        this.camera.position.x = this.mouseX * 2.0;
        this.camera.position.y = -this.mouseY * 2.0;
        this.camera.position.z = baseZ - Math.abs(this.mouseX) * 0.2;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Application();
});