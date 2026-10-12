import * as THREE from 'three';
import { CONFIG } from './config.js';

const colorPink = new THREE.Color(0xFF5C9E);
const colorRed = new THREE.Color(0xFF6FA5);

export class HeartParticle {
    constructor(targetX, targetY, targetZ, t1, t2, isPink, minY, maxY, index) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetZ = targetZ;

        this.text1X = t1.x;
        this.text1Y = t1.y;
        this.text1Z = t1.z;

        this.text2X = t2.x;
        this.text2Y = t2.y;
        this.text2Z = t2.z;

        this.isPink = isPink;
        this.minY = minY;
        this.maxY = maxY;
        this.index = index;

        const baseColor = isPink ? colorPink : colorRed;
        this.originalR = baseColor.r;
        this.originalG = baseColor.g;
        this.originalB = baseColor.b;
        this.r = this.originalR;
        this.g = this.originalG;
        this.b = this.originalB;

        this.twinklePhase = Math.random() * Math.PI * 2;

        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        this.shatterOffsetX = 0;
        this.shatterOffsetY = 0;
        this.shatterOffsetZ = 0;
        this.shatterVx = 0;
        this.shatterVy = 0;
        this.shatterVz = 0;
        this.isShattered = false;

        this.reset();
    }

    reset() {
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        this.shatterOffsetX = 0;
        this.shatterOffsetY = 0;
        this.shatterOffsetZ = 0;
        this.shatterVx = 0;
        this.shatterVy = 0;
        this.shatterVz = 0;
        this.isShattered = false;

        this.age = 0;
        this.state = 'swirling';
        this.opacity = 0.5;

        this.r = this.originalR;
        this.g = this.originalG;
        this.b = this.originalB;

        const orbY = CONFIG.HEART.ORB_Y || -2.2;

        this.spawnAngle = Math.random() * Math.PI * 2;
        this.targetBaseRadius = 0.85 + Math.random() * 1.25;
        this.spawnYOffset = (Math.random() - 0.5) * 0.26;

        this.x = 0;
        this.y = orbY;
        this.z = 0;

        this.crawlProgress = 0.0;
        this.crawlDelay = (this.index / CONFIG.HEART.PARTICLE_COUNT) * 1.5;
        this.flyProgress = 0.0;
    }

    explode() {
        this.state = 'dissolving';
        const dist = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z) || 1;
        const force = 0.038 + Math.random() * 0.045;

        this.vx = (this.x / dist) * force + (Math.random() - 0.5) * 0.012;
        this.vy = (this.y / dist) * force + 0.008 + (Math.random() - 0.5) * 0.012;
        this.vz = (this.z / dist) * force + (Math.random() - 0.5) * 0.012;
    }

    update(pulse, globalState, timeInSeconds = 0, timeScale = 0.1, activeStreakHeads = []) {
        this.age++;
        const orbY = CONFIG.HEART.ORB_Y || -2.2;
        const startY = orbY + this.spawnYOffset;

        if (globalState === 'forming' || globalState === 'stable') {
            // 0s -> 3.2s: Ở đĩa đáy
            if (timeInSeconds < 3.2) {
                this.state = 'swirling';
                this.spawnAngle += 0.02 * timeScale;

                if (timeInSeconds > this.crawlDelay) {
                    this.crawlProgress = Math.min(1.0, this.crawlProgress + 0.0035 * timeScale);
                }
                const easeCrawl = 1 - Math.pow(1 - this.crawlProgress, 2.8);
                const curR = THREE.MathUtils.lerp(0.01, this.targetBaseRadius, easeCrawl);

                this.x = Math.cos(this.spawnAngle) * curR;
                this.y = orbY + this.spawnYOffset * easeCrawl;
                this.z = Math.sin(this.spawnAngle) * curR;
                this.opacity = 0.25 + easeCrawl * 0.50;
            }
            // 3.2s -> 4.4s: TỐC ĐỘ TẠO HÌNH TIM BAY LÊN
            else if (timeInSeconds >= 3.2 && this.flyProgress < 1.0) {
                this.state = 'rising';

                // === CHỈNH TỐC ĐỘ TẠO HÌNH TIM Ở SỐ 0.014 NÀY ===
                this.flyProgress = Math.min(1.0, this.flyProgress + 0.024 * timeScale);

                const t = this.flyProgress;
                const easeT = 1 - Math.pow(1 - t, 3);

                const spiralAngle = this.spawnAngle + t * Math.PI * 2.8;
                const targetR = Math.sqrt(this.targetX * this.targetX + this.targetZ * this.targetZ) || 0.1;
                const curRadius = THREE.MathUtils.lerp(this.targetBaseRadius, targetR, easeT);

                this.x = THREE.MathUtils.lerp(Math.cos(spiralAngle) * curRadius, this.targetX, easeT);
                this.y = startY + (this.targetY - startY) * easeT;
                this.z = THREE.MathUtils.lerp(Math.sin(spiralAngle) * curRadius, this.targetZ, easeT);
                this.opacity = 0.70 + easeT * 0.30;

                if (t >= 1.0) {
                    this.state = 'heart';
                }
            }
            // GIAI ĐOẠN ĐÃ THÀNH HÌNH TIM: VA CHẠM THỰC TẾ
            else {
                this.state = 'heart';

                // KIỂM TRA VA CHẠM 3D THỰC TẾ VỚI CÁC ĐẦU VỆT SÁNG
                if (!this.isShattered && activeStreakHeads.length > 0) {
                    for (let h = 0; h < activeStreakHeads.length; h++) {
                        const head = activeStreakHeads[h];
                        const dy = this.y - head.y;
                        if (Math.abs(dy) > 0.38) continue; // Bỏ qua nếu xa theo trục Y

                        const dx = this.x - head.x;
                        const dz = this.z - head.z;
                        const dSq = dx * dx + dy * dy + dz * dz;

                        // CỰ LY VA CHẠM THỰC TẾ TRONG KHÔNG GIAN 3D (dist < 0.38)
                        if (dSq < 0.1444 && dSq > 0.0001) {
                            const dist = Math.sqrt(dSq);
                            this.isShattered = true; // KÍCH HOẠT VỠ THẬT SỰ

                            const shatterForce = (0.05 + Math.random() * 0.04) * timeScale;
                            this.shatterVx = (dx / dist) * shatterForce + (Math.random() - 0.5) * 0.02 * timeScale;
                            this.shatterVy = (dy / dist) * shatterForce + (Math.random() - 0.5) * 0.02 * timeScale;
                            this.shatterVz = (dz / dist) * shatterForce + (Math.random() - 0.5) * 0.02 * timeScale;
                            break;
                        }
                    }
                }

                // NẾU ĐÃ BỊ VỠ: DẠT RA VÀ DUY TRÌ VẾT NỨT TẠI 4.4s -> 5.4s
                if (this.isShattered && (timeInSeconds >= 4.4 && timeInSeconds < 5.4)) {
                    this.shatterOffsetX += this.shatterVx;
                    this.shatterOffsetY += this.shatterVy;
                    this.shatterOffsetZ += this.shatterVz;
                    this.shatterVx *= Math.pow(0.92, timeScale);
                    this.shatterVy *= Math.pow(0.92, timeScale);
                    this.shatterVz *= Math.pow(0.92, timeScale);

                    this.x = this.targetX * pulse + this.shatterOffsetX;
                    this.y = this.targetY * pulse + this.shatterOffsetY;
                    this.z = this.targetZ * pulse + this.shatterOffsetZ;
                }
                // BIẾN HÌNH CHỮ "I Miss You" (5.4s -> 8.0s)
                else if (timeInSeconds >= 5.4 && timeInSeconds < 8.0) {
                    this.isShattered = false;
                    const morphSpeed = 0.065 * timeScale;
                    this.x = THREE.MathUtils.lerp(this.x, this.text1X, morphSpeed);
                    this.y = THREE.MathUtils.lerp(this.y, this.text1Y, morphSpeed);
                    this.z = THREE.MathUtils.lerp(this.z, this.text1Z, morphSpeed);
                    this.opacity = 0.90;
                }
                // BIẾN HÌNH CHỮ "I Love You" (8.0s -> 10.5s)
                else if (timeInSeconds >= 8.0 && timeInSeconds < 10.5) {
                    const morphSpeed = 0.065 * timeScale;
                    this.x = THREE.MathUtils.lerp(this.x, this.text2X, morphSpeed);
                    this.y = THREE.MathUtils.lerp(this.y, this.text2Y, morphSpeed);
                    this.z = THREE.MathUtils.lerp(this.z, this.text2Z, morphSpeed);
                    this.opacity = 0.95;
                }
                // QUAY LẠI TRÁI TIM HOÀN CHỈNH (10.5s -> 12.0s)
                else if (timeInSeconds >= 10.5 && timeInSeconds < 12.0) {
                    const morphSpeed = 0.08 * timeScale;
                    const curHeartX = this.targetX * pulse;
                    const curHeartY = this.targetY * pulse;
                    const curHeartZ = this.targetZ * pulse;

                    this.x = THREE.MathUtils.lerp(this.x, curHeartX, morphSpeed);
                    this.y = THREE.MathUtils.lerp(this.y, curHeartY, morphSpeed);
                    this.z = THREE.MathUtils.lerp(this.z, curHeartZ, morphSpeed);
                    this.opacity = 0.88;
                }
                // BÌNH THƯỜNG: ĐẬP NHỊP TIM VÀ NHẤP NHÁY
                else {
                    const shimmer = Math.sin(this.age * 0.03 * timeScale + this.twinklePhase) * 0.18;
                    this.opacity = Math.max(0.65, Math.min(1.0, 0.88 + shimmer));
                    this.x = this.targetX * pulse;
                    this.y = this.targetY * pulse;
                    this.z = this.targetZ * pulse;
                }
            }
        }
        else if (globalState === 'dissolving') {
            this.vx *= Math.pow(0.985, timeScale);
            this.vy *= Math.pow(0.985, timeScale);
            this.vz *= Math.pow(0.985, timeScale);
            this.vy -= 0.0003 * timeScale;

            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.z += this.vz * timeScale;

            this.opacity = Math.max(0.0, this.opacity - 0.0075 * timeScale);
        }
    }
}