import * as THREE from 'three';
import { CONFIG } from './config.js';
import { BABY_NEON_PINK_COLORS } from './heart.js';

const colorPink = new THREE.Color(0xEE5588);
const colorRed = new THREE.Color(0xEE6699);
const tempColor = new THREE.Color();

export class HeartParticle {
    constructor(targetX, targetY, targetZ, isPink, minY, maxY, index) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetZ = targetZ;
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

        this.colorProgress = Math.random() * BABY_NEON_PINK_COLORS.length;
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
        this.targetBaseRadius = 0.95 + Math.random() * 0.95;
        this.spawnYOffset = (Math.random() - 0.5) * 0.26;

        // BẮT ĐẦU TẠI TÂM ĐĨA ĐÁY CÙNG VỆT SÁNG
        this.x = 0;
        this.y = orbY;
        this.z = 0;

        this.crawlProgress = 0.0;
        this.crawlDelay = (this.index / CONFIG.HEART.PARTICLE_COUNT) * 1.6;
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

    update(pulse, globalState, activeStreakHeads = [], isRestoringHeart = false, isTriggerFullShatter = false, timeInSeconds = 0) {
        this.age++;
        const orbY = CONFIG.HEART.ORB_Y || -2.2;
        const startY = orbY + this.spawnYOffset;

        if (globalState === 'forming' || globalState === 'stable') {
            // 1. GIAI ĐOẠN 0s -> 3.5s: Ở ĐĨA ĐÁY CÙNG VỆT SÁNG NỞ RA TỪ TÂM
            if (timeInSeconds < 3.5) {
                this.state = 'swirling';
                this.spawnAngle += 0.02;

                if (timeInSeconds > this.crawlDelay) {
                    this.crawlProgress = Math.min(1.0, this.crawlProgress + 0.003);
                }
                const easeCrawl = 1 - Math.pow(1 - this.crawlProgress, 2.8);
                const curR = THREE.MathUtils.lerp(0.01, this.targetBaseRadius, easeCrawl);

                this.x = Math.cos(this.spawnAngle) * curR;
                this.y = orbY + this.spawnYOffset * easeCrawl;
                this.z = Math.sin(this.spawnAngle) * curR;
                this.opacity = 0.2 + easeCrawl * 0.45;
            }
            // 2. GIAI ĐOẠN 3.5s -> 5.5s: CÙNG BAY LÊN THEO ĐƯỜNG ĐI XOẮN ỐC Y CHANG VỆT SÁNG
            else if (timeInSeconds >= 3.5 && this.flyProgress < 1.0) {
                this.state = 'rising';
                this.flyProgress = Math.min(1.0, this.flyProgress + 0.009); // Bay lên thành hình tim
                const t = this.flyProgress;
                const easeT = 1 - Math.pow(1 - t, 3);

                // Quỹ đạo xoắn ốc uốn lượn y chang vệt sáng
                const spiralAngle = this.spawnAngle + t * Math.PI * 2.8;
                const targetR = Math.sqrt(this.targetX * this.targetX + this.targetZ * this.targetZ) || 0.1;
                const curRadius = THREE.MathUtils.lerp(this.targetBaseRadius, targetR, easeT);

                this.x = THREE.MathUtils.lerp(Math.cos(spiralAngle) * curRadius, this.targetX, easeT);
                this.y = startY + (this.targetY - startY) * easeT;
                this.z = THREE.MathUtils.lerp(Math.sin(spiralAngle) * curRadius, this.targetZ, easeT);
                this.opacity = 0.6 + easeT * 0.4;

                if (t >= 1.0) {
                    this.state = 'heart';
                }
            }
            // 3. GIAI ĐOẠN KẾT HÌNH TIM: VA CHẠM VỠ 100% -> KHÔI PHỤC KHI TUNG
            else {
                this.state = 'heart';

                // A. VA CHẠM TRỰC DIỆN VỚI VỆT SÁNG
                if (!this.isShattered && activeStreakHeads.length > 0) {
                    for (let h = 0; h < activeStreakHeads.length; h++) {
                        const head = activeStreakHeads[h];
                        const dy = this.y - head.y;
                        if (Math.abs(dy) > 0.38) continue;

                        const dx = this.x - head.x;
                        const dz = this.z - head.z;
                        const dSq = dx * dx + dy * dy + dz * dz;

                        if (dSq < 0.1444 && dSq > 0.0001) {
                            const dist = Math.sqrt(dSq);
                            this.isShattered = true;

                            const shatterSpeed = 0.035 + Math.random() * 0.035;
                            this.shatterVx = (dx / dist) * shatterSpeed + (Math.random() - 0.5) * 0.015;
                            this.shatterVy = (dy / dist) * shatterSpeed + (Math.random() - 0.5) * 0.015;
                            this.shatterVz = (dz / dist) * shatterSpeed + (Math.random() - 0.5) * 0.015;
                            break;
                        }
                    }
                }

                // B. CHẤN ĐỘNG LAN TRUYỀN: HẠT NÀO CHƯA ĐƯỢC CHẠM CŨNG VỠ HẾT 100%
                if (!this.isShattered && isTriggerFullShatter) {
                    this.isShattered = true;
                    const angle = Math.random() * Math.PI * 2;
                    const shatterSpeed = 0.025 + Math.random() * 0.035;
                    this.shatterVx = Math.cos(angle) * shatterSpeed;
                    this.shatterVy = (Math.random() - 0.5) * shatterSpeed;
                    this.shatterVz = Math.sin(angle) * shatterSpeed;
                }

                // C. KHÔI PHỤC HÀN GẮN TẠI GIÂY 7.0s
                if (this.isShattered) {
                    if (isRestoringHeart) {
                        this.shatterOffsetX = THREE.MathUtils.lerp(this.shatterOffsetX, 0, 0.08);
                        this.shatterOffsetY = THREE.MathUtils.lerp(this.shatterOffsetY, 0, 0.08);
                        this.shatterOffsetZ = THREE.MathUtils.lerp(this.shatterOffsetZ, 0, 0.08);

                        if (Math.abs(this.shatterOffsetX) < 0.005 && Math.abs(this.shatterOffsetY) < 0.005) {
                            this.shatterOffsetX = 0;
                            this.shatterOffsetY = 0;
                            this.shatterOffsetZ = 0;
                            this.isShattered = false;
                        }
                    } else {
                        this.shatterOffsetX += this.shatterVx;
                        this.shatterOffsetY += this.shatterVy;
                        this.shatterOffsetZ += this.shatterVz;

                        this.shatterVx *= 0.92;
                        this.shatterVy *= 0.92;
                        this.shatterVz *= 0.92;
                    }
                }

                // D. LUNG LINH CHẬM RÃI KHI CHƯA VỠ
                let slowTwinkleWave = 0;
                if (!this.isShattered) {
                    const shimmer = Math.sin(this.age * 0.03 + this.twinklePhase) * 0.22;
                    this.opacity = Math.max(0.55, Math.min(1.0, 0.82 + shimmer));
                    slowTwinkleWave = Math.sin(this.age * 0.02 + this.twinklePhase) * 0.008;
                }

                this.x = this.targetX * pulse + this.shatterOffsetX + slowTwinkleWave;
                this.y = this.targetY * pulse + this.shatterOffsetY;
                this.z = this.targetZ * pulse + this.shatterOffsetZ + slowTwinkleWave;
            }
        }
        else if (globalState === 'dissolving') {
            this.vx *= 0.985;
            this.vy *= 0.985;
            this.vz *= 0.985;
            this.vy -= 0.0003;

            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;

            this.colorProgress += 0.025;
            const cIdx = Math.floor(this.colorProgress) % BABY_NEON_PINK_COLORS.length;
            const nextCIdx = (cIdx + 1) % BABY_NEON_PINK_COLORS.length;
            tempColor.copy(BABY_NEON_PINK_COLORS[cIdx]).lerp(BABY_NEON_PINK_COLORS[nextCIdx], this.colorProgress % 1.0);

            this.r = tempColor.r;
            this.g = tempColor.g;
            this.b = tempColor.b;

            this.opacity = Math.max(0.0, this.opacity - 0.0075);
        }
    }
}