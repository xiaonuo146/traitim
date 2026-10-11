import * as THREE from 'three';

export function createGlowTexture(colorHex, size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

    const r = (colorHex >> 16) & 255;
    const g = (colorHex >> 8) & 255;
    const b = colorHex & 255;

    // TÂM SÁNG DỊU KHUẾCH TÁN, KHÔNG CHÓI LÒA
    gradient.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, 0.55)`);
    gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 0.30)`);
    gradient.addColorStop(0.60, `rgba(${r}, ${g}, ${b}, 0.08)`);
    gradient.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}