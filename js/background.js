import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createGlowTexture } from './utils.js';

export class AmbientParticles {
    constructor() {
        this.points = null;
        this.count = CONFIG.AMBIENT.PARTICLE_COUNT;
        this.velocities = [];

        this.init();
    }

    init() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < this.count; i++) {
            positions.push(
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );

            this.velocities.push(
                (Math.random() - 0.5) * 0.0015,
                0.002 + Math.random() * 0.003,
                (Math.random() - 0.5) * 0.0015
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const texture = createGlowTexture(CONFIG.COLORS.AMB_PARTICLE, 64);
        const material = new THREE.PointsMaterial({
            size: CONFIG.AMBIENT.SIZE,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.45,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(geometry, material);
    }

    update() {
        const positions = this.points.geometry.attributes.position.array;

        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;
            positions[idx] += this.velocities[idx];
            positions[idx + 1] += this.velocities[idx + 1];
            positions[idx + 2] += this.velocities[idx + 2];

            if (positions[idx + 1] > 6) {
                positions[idx] = (Math.random() - 0.5) * 16;
                positions[idx + 1] = -6;
                positions[idx + 2] = (Math.random() - 0.5) * 12;
            }
        }

        this.points.geometry.attributes.position.needsUpdate = true;
    }
}