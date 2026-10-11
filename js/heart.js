import * as THREE from 'three';
import { CONFIG } from './config.js';
import { HeartParticle } from './particle.js';
import { createGlowTexture } from './utils.js';

// MÀU HỒNG BABY NEON DỊU MẮT, KHÔNG CHÓI
export const BABY_NEON_PINK_COLORS = [
    new THREE.Color(0xEE5588),
    new THREE.Color(0xEE6699),
    new THREE.Color(0xDD4477),
    new THREE.Color(0xFF77AA),
    new THREE.Color(0xEE5C9E),
    new THREE.Color(0xDD6699),
    new THREE.Color(0xEE3D85),
    new THREE.Color(0xDD70A5)
];
const tempColor = new THREE.Color();

export class Heart {
    constructor() {
        this.group = new THREE.Group();
        this.pulseTime = 0;
        this.pulse = 1;
        this.cycleTimer = 0;
        this.globalState = 'forming';

        this.pinkParticles = [];
        this.redParticles = [];

        this.babyNeonGlow = createGlowTexture(0xEE5588, 128);

        this.vortexData = [];
        this.segmentsPerStreak = 4;
        this.activeStreakHeads = [];

        this.init();
    }

    init() {
        const count = CONFIG.HEART.PARTICLE_COUNT;
        const orbY = CONFIG.HEART.ORB_Y || -2.2;

        const tiltX = 0.25;
        const tiltZ = -0.15;
        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);
        const cosZ = Math.cos(tiltZ);
        const sinZ = Math.sin(tiltZ);

        // ==========================================================
        // 1. TẠO HÌNH TIM: KHỬ VÓN CỤC 2 ĐẦU MÚT
        // ==========================================================
        const rawCoords = [];
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < count; i++) {
            let u;
            while (true) {
                u = 0.08 + Math.random() * (Math.PI - 0.16);
                if (Math.random() < Math.pow(Math.sin(u), 1.5)) break;
            }

            const v = (Math.random() - 0.5) * Math.PI * 2;
            const sinU = Math.sin(u);
            const cosU = Math.cos(u);

            let tx = 16 * Math.pow(sinU, 3) * Math.cos(v);
            let tz = 16 * Math.pow(sinU, 3) * Math.sin(v);
            let y = 13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);

            if (sinU < 0.28) {
                const spreadR = (0.28 - sinU) * 1.6;
                tx += Math.cos(v) * spreadR + (Math.random() - 0.5) * 0.25;
                tz += Math.sin(v) * spreadR + (Math.random() - 0.5) * 0.25;
            }

            const thickness = 0.85 + Math.random() * 0.3;
            tx *= thickness * CONFIG.HEART.BASE_SCALE;
            y *= thickness * CONFIG.HEART.BASE_SCALE;
            tz *= thickness * CONFIG.HEART.BASE_SCALE;

            const ry1 = y * cosX - tz * sinX;
            const rz1 = y * sinX + tz * cosX;
            const rx2 = tx * cosZ - ry1 * sinZ;
            const ry2 = tx * sinZ + ry1 * cosZ;

            if (ry2 < minY) minY = ry2;
            if (ry2 > maxY) maxY = ry2;

            rawCoords.push({ x: rx2, y: ry2, z: rz1 });
        }

        // ==========================================================
        // 2. KHỞI TẠO CÁC HẠT TIM (XUẤT HIỆN TỪ ĐÁY CÙNG VỆT SÁNG)
        // ==========================================================
        const pinkCoords = [];
        const redCoords = [];

        for (let i = 0; i < count; i++) {
            const pt = rawCoords[i];
            const isPink = Math.random() > 0.4;

            if (isPink) {
                const p = new HeartParticle(pt.x, pt.y, pt.z, true, minY, maxY, i);
                this.pinkParticles.push(p);
                pinkCoords.push(p.x, p.y, p.z);
            } else {
                const p = new HeartParticle(pt.x, pt.y, pt.z, false, minY, maxY, i);
                this.redParticles.push(p);
                redCoords.push(p.x, p.y, p.z);
            }
        }

        this.pinkGeometry = new THREE.BufferGeometry();
        this.pinkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pinkCoords, 3));
        this.pinkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(this.pinkParticles.length * 3), 3));
        this.pinkPoints = new THREE.Points(this.pinkGeometry, new THREE.PointsMaterial({
            size: 0.11,
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        }));
        this.pinkPoints.renderOrder = 100;
        this.group.add(this.pinkPoints);

        this.redGeometry = new THREE.BufferGeometry();
        this.redGeometry.setAttribute('position', new THREE.Float32BufferAttribute(redCoords, 3));
        this.redGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(this.redParticles.length * 3), 3));
        this.redPoints = new THREE.Points(this.redGeometry, new THREE.PointsMaterial({
            size: 0.10,
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        }));
        this.redPoints.renderOrder = 100;
        this.group.add(this.redPoints);

        // ==========================================================
        // 3. VÒNG XOÁY ĐÁY: TẠO HÌNH TRÒN TỪ TÂM CHẬM LẠI HƠN NỮA (0s - 3.5s)
        // ==========================================================
        const vortexCount = 1400;
        const vPositions = new Float32Array(vortexCount * 3);
        const vColors = new Float32Array(vortexCount * 3);

        const streakPositions = [];
        const streakColors = [];
        const auraPositions = [];
        const auraColors = [];

        const colorBasePink = new THREE.Color(0xEE5588);
        const colorBaseRed = new THREE.Color(0xEE6699);

        const innerR = 0.95;
        const outerR = 2.05;

        for (let i = 0; i < vortexCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const targetRadius = Math.sqrt(innerR * innerR + Math.random() * (outerR * outerR - innerR * innerR));
            const targetYOffset = (Math.random() - 0.5) * 0.26;

            const speed = 0.016 + Math.random() * 0.022; // Quay chậm rãi
            const chosenColor = Math.random() > 0.4 ? colorBasePink : colorBaseRed;
            const hasStreak = i < vortexCount * 0.5;

            const theta = angle + (Math.random() - 0.5) * 0.6;
            const phi = (Math.random() - 0.5) * Math.PI * 0.85;
            const baseScatterSpeed = 0.065 + Math.random() * 0.075;

            const initialColorProgress = (i * 0.618033) * BABY_NEON_PINK_COLORS.length;

            const initialScatterVx = Math.cos(phi) * Math.cos(theta) * baseScatterSpeed;
            const initialScatterVy = Math.sin(phi) * baseScatterSpeed * 1.15;
            const initialScatterVz = Math.cos(phi) * Math.sin(theta) * baseScatterSpeed;

            // Đích đến va chạm toàn bộ thân tim
            const heartTargetY = -1.4 + Math.random() * 2.5;
            const heartBoundRadius = (1.5 - Math.abs(heartTargetY - 0.1) * 0.4) * (0.35 + Math.random() * 0.55);

            this.vortexData.push({
                angle,
                targetRadius,
                targetYOffset,
                crawlProgress: 0.0,
                crawlDelay: (i / vortexCount) * 1.6, // Từng vệt bò so le độc lập
                speed,
                baseY: orbY,
                driftPhase: Math.random() * Math.PI * 2,
                driftAmp: 0.04 + Math.random() * 0.08,

                heartTargetY,
                heartBoundRadius,

                originalR: chosenColor.r,
                originalG: chosenColor.g,
                originalB: chosenColor.b,
                r: chosenColor.r,
                g: chosenColor.g,
                b: chosenColor.b,
                colorProgress: initialColorProgress,
                hasStreak,
                flyProgress: 0.0,

                initialScatterVx,
                initialScatterVy,
                initialScatterVz,

                scatterVx: initialScatterVx,
                scatterVy: initialScatterVy,
                scatterVz: initialScatterVz,
                scatterOffsetX: 0,
                scatterOffsetY: 0,
                scatterOffsetZ: 0,
                alpha: 0.35,

                isParticleBurst: false,
                burstX: 0,
                burstY: 0,
                burstZ: 0,
                burstVx: 0,
                burstVy: 0,
                burstVz: 0,

                reset() {
                    this.flyProgress = 0.0;
                    this.crawlProgress = 0.0;
                    this.scatterVx = this.initialScatterVx;
                    this.scatterVy = this.initialScatterVy;
                    this.scatterVz = this.initialScatterVz;
                    this.scatterOffsetX = 0;
                    this.scatterOffsetY = 0;
                    this.scatterOffsetZ = 0;
                    this.alpha = 0.35;
                    this.isParticleBurst = false;
                    this.r = this.originalR;
                    this.g = this.originalG;
                    this.b = this.originalB;
                }
            });

            const idx = i * 3;
            vPositions[idx] = 0;
            vPositions[idx + 1] = orbY;
            vPositions[idx + 2] = 0;

            vColors[idx] = chosenColor.r;
            vColors[idx + 1] = chosenColor.g;
            vColors[idx + 2] = chosenColor.b;

            if (hasStreak) {
                for (let k = 0; k < this.segmentsPerStreak; k++) {
                    streakPositions.push(0, 0, 0, 0, 0, 0);
                    const fadeHead = 1.0 - k * 0.22;
                    const fadeTail = 1.0 - (k + 1) * 0.22;
                    streakColors.push(
                        chosenColor.r * fadeHead, chosenColor.g * fadeHead, chosenColor.b * fadeHead,
                        chosenColor.r * fadeTail, chosenColor.g * fadeTail, chosenColor.b * fadeTail
                    );
                    auraPositions.push(0, 0, 0);
                    auraColors.push(chosenColor.r * fadeHead, chosenColor.g * fadeHead, chosenColor.b * fadeHead);
                }
            }
        }

        this.vortexGeometry = new THREE.BufferGeometry();
        this.vortexGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vPositions, 3));
        this.vortexGeometry.setAttribute('color', new THREE.Float32BufferAttribute(vColors, 3));
        this.vortexPoints = new THREE.Points(this.vortexGeometry, new THREE.PointsMaterial({
            size: 0.12,
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        }));
        this.vortexPoints.renderOrder = 3;
        this.group.add(this.vortexPoints);

        this.streakGeometry = new THREE.BufferGeometry();
        this.streakGeometry.setAttribute('position', new THREE.Float32BufferAttribute(streakPositions, 3));
        this.streakGeometry.setAttribute('color', new THREE.Float32BufferAttribute(streakColors, 3));
        this.streakMesh = new THREE.LineSegments(this.streakGeometry, new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.65
        }));
        this.streakMesh.renderOrder = 2;
        this.group.add(this.streakMesh);

        this.streakAuraGeometry = new THREE.BufferGeometry();
        this.streakAuraGeometry.setAttribute('position', new THREE.Float32BufferAttribute(auraPositions, 3));
        this.streakAuraGeometry.setAttribute('color', new THREE.Float32BufferAttribute(auraColors, 3));
        this.streakAuraPoints = new THREE.Points(this.streakAuraGeometry, new THREE.PointsMaterial({
            size: 0.09,
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            opacity: 0.35
        }));
        this.streakAuraPoints.renderOrder = 1;
        this.group.add(this.streakAuraPoints);
    }

    triggerPureParticleExplosion() {
        this.streakMesh.visible = false;
        this.streakAuraPoints.visible = false;

        for (let i = 0; i < this.vortexData.length; i++) {
            const data = this.vortexData[i];
            data.isParticleBurst = true;
            data.alpha = 1.0;

            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            const speed = 0.04 + Math.random() * 0.07;

            data.burstVx = Math.cos(phi) * Math.cos(theta) * speed;
            data.burstVy = Math.sin(phi) * speed + 0.005;
            data.burstVz = Math.cos(phi) * Math.sin(theta) * speed;
        }
    }

    update() {
        this.group.rotation.y += CONFIG.HEART.ROTATION_SPEED_Y;

        this.pulseTime += 0.028;
        const beatCycle = this.pulseTime % (Math.PI * 2);
        if (beatCycle < Math.PI * 0.4) {
            this.pulse = 1 + 0.12 * Math.sin((beatCycle / (Math.PI * 0.4)) * Math.PI);
        } else if (beatCycle < Math.PI * 0.8) {
            this.pulse = 1 + 0.05 * Math.sin(((beatCycle - Math.PI * 0.4) / (Math.PI * 0.4)) * Math.PI);
        } else {
            this.pulse = 1;
        }

        this.cycleTimer++;
        const TOTAL_CYCLE = 900;
        const currentFrame = this.cycleTimer % TOTAL_CYCLE;
        const timeInSeconds = currentFrame / 60;

        // TIMELINE:
        // 0s - 3.5s: Tạo hình tròn đĩa đáy từ tâm siêu chậm
        // 3.5s - 7.0s: Cùng bay lên theo đường đi xoắn ốc -> Va chạm làm vỡ 100% hạt tim
        // 7.0s+: Vệt sáng bung toán loạn -> Trái tim khôi phục 100% hoàn hảo
        const isEruptingSlow = timeInSeconds >= 3.5 && timeInSeconds < 7.0;
        const isTriggerFullShatter = timeInSeconds >= 5.8 && timeInSeconds < 7.0; // SÓNG CHẤN ĐỘNG VỠ 100% HẠT TIM
        const isScatteringFirst = timeInSeconds >= 7.0 && timeInSeconds < 12.0;
        const isRestoringHeart = isScatteringFirst; // HÀN GẮN KHÔI PHỤC KHI TUNG RA

        if (currentFrame === 0) {
            this.globalState = 'forming';
            this.streakMesh.visible = true;
            this.streakAuraPoints.visible = true;
            this.pinkParticles.forEach(p => p.reset());
            this.redParticles.forEach(p => p.reset());
            this.vortexData.forEach(d => d.reset());
        }
        else if (timeInSeconds >= 7.5 && timeInSeconds < 12.0) {
            this.globalState = 'stable';
        }
        else if (timeInSeconds >= 12.0) {
            if (this.globalState !== 'dissolving') {
                this.globalState = 'dissolving';
                this.pinkParticles.forEach(p => p.explode());
                this.redParticles.forEach(p => p.explode());
                this.triggerPureParticleExplosion();
            }
        }

        // Lấy tọa độ đầu vệt sáng để va chạm hạt tim
        this.activeStreakHeads = [];
        if (isEruptingSlow) {
            for (let i = 0; i < this.vortexData.length; i += 20) {
                const d = this.vortexData[i];
                if (d.curHeadX !== undefined) {
                    this.activeStreakHeads.push({ x: d.curHeadX, y: d.curHeadY, z: d.curHeadZ });
                }
            }
        }

        // 1. CẬP NHẬT HẠT TIM (BAY LÊN CÙNG VỆT SÁNG -> VỠ 100% TOÀN BỘ -> KHÔI PHỤC KHI TUNG)
        const pinkPos = this.pinkGeometry.attributes.position.array;
        const pinkCol = this.pinkGeometry.attributes.color.array;
        for (let i = 0; i < this.pinkParticles.length; i++) {
            const p = this.pinkParticles[i];
            p.update(this.pulse, this.globalState, this.activeStreakHeads, isRestoringHeart, isTriggerFullShatter, timeInSeconds);
            const idx = i * 3;
            pinkPos[idx] = p.x; pinkPos[idx + 1] = p.y; pinkPos[idx + 2] = p.z;
            pinkCol[idx] = p.r * p.opacity; pinkCol[idx + 1] = p.g * p.opacity; pinkCol[idx + 2] = p.b * p.opacity;
        }
        this.pinkGeometry.attributes.position.needsUpdate = true;
        this.pinkGeometry.attributes.color.needsUpdate = true;

        const redPos = this.redGeometry.attributes.position.array;
        const redCol = this.redGeometry.attributes.color.array;
        for (let i = 0; i < this.redParticles.length; i++) {
            const p = this.redParticles[i];
            p.update(this.pulse, this.globalState, this.activeStreakHeads, isRestoringHeart, isTriggerFullShatter, timeInSeconds);
            const idx = i * 3;
            redPos[idx] = p.x; redPos[idx + 1] = p.y; redPos[idx + 2] = p.z;
            redCol[idx] = p.r * p.opacity; redCol[idx + 1] = p.g * p.opacity; redCol[idx + 2] = p.b * p.opacity;
        }
        this.redGeometry.attributes.position.needsUpdate = true;
        this.redGeometry.attributes.color.needsUpdate = true;

        // 2. CẬP NHẬT VÒNG XOÁY
        const vPos = this.vortexGeometry.attributes.position.array;
        const vCol = this.vortexGeometry.attributes.color.array;
        const sPos = this.streakGeometry.attributes.position.array;
        const sCol = this.streakGeometry.attributes.color.array;

        const aPos = this.streakAuraGeometry.attributes.position.array;
        const aCol = this.streakAuraGeometry.attributes.color.array;

        let sIdx = 0;
        let aIdx = 0;

        for (let i = 0; i < this.vortexData.length; i++) {
            const data = this.vortexData[i];

            if (data.isParticleBurst) {
                data.burstVx *= 0.985;
                data.burstVy *= 0.985;
                data.burstVz *= 0.985;
                data.burstVy -= 0.0003;

                data.burstX += data.burstVx;
                data.burstY += data.burstVy;
                data.burstZ += data.burstVz;

                data.alpha = Math.max(0.0, data.alpha - 0.0075);

                data.colorProgress += 0.025;
                const cIdx = Math.floor(data.colorProgress) % BABY_NEON_PINK_COLORS.length;
                const nextCIdx = (cIdx + 1) % BABY_NEON_PINK_COLORS.length;
                tempColor.copy(BABY_NEON_PINK_COLORS[cIdx]).lerp(BABY_NEON_PINK_COLORS[nextCIdx], data.colorProgress % 1.0);

                const idx = i * 3;
                vPos[idx] = data.burstX;
                vPos[idx + 1] = data.burstY;
                vPos[idx + 2] = data.burstZ;

                vCol[idx] = tempColor.r * 0.55 * data.alpha;
                vCol[idx + 1] = tempColor.g * 0.55 * data.alpha;
                vCol[idx + 2] = tempColor.b * 0.55 * data.alpha;
            }
            else {
                let currentRadius;
                let currentHeight;

                if (isScatteringFirst) {
                    const scatterElapsed = timeInSeconds - 7.0;
                    const burstImpulse = Math.max(1.0, 3.2 - scatterElapsed * 3.5);

                    data.scatterOffsetX += data.scatterVx * burstImpulse;
                    data.scatterOffsetY += data.scatterVy * burstImpulse;
                    data.scatterOffsetZ += data.scatterVz * burstImpulse;

                    data.scatterVx *= 0.993;
                    data.scatterVy *= 0.993;
                    data.scatterVz *= 0.993;

                    data.angle += data.speed * 0.45;

                    const safeClearance = Math.min(1.0, scatterElapsed * 4.0) * 1.8;
                    currentRadius = data.targetRadius * 0.5 + safeClearance;
                    currentHeight = data.baseY + data.scatterOffsetY;

                    data.alpha = 1.0;

                    data.colorProgress += 0.022;
                    const cIdx = Math.floor(data.colorProgress) % BABY_NEON_PINK_COLORS.length;
                    const nextCIdx = (cIdx + 1) % BABY_NEON_PINK_COLORS.length;
                    tempColor.copy(BABY_NEON_PINK_COLORS[cIdx]).lerp(BABY_NEON_PINK_COLORS[nextCIdx], data.colorProgress % 1.0);
                    data.r = tempColor.r;
                    data.g = tempColor.g;
                    data.b = tempColor.b;
                }
                // GIAI ĐOẠN 3.5s -> 7.0s: BAY LÊN THEO ĐƯỜNG XOẮN ỐC
                else if (isEruptingSlow) {
                    data.flyProgress = Math.min(1.0, data.flyProgress + 0.0035);
                    const t = data.flyProgress;
                    const easeT = 1 - Math.pow(1 - t, 2.5);

                    data.angle += data.speed * 0.5;

                    currentRadius = THREE.MathUtils.lerp(data.targetRadius, data.heartBoundRadius, easeT);
                    currentHeight = (data.baseY + data.targetYOffset) + (data.heartTargetY - (data.baseY + data.targetYOffset)) * easeT;

                    data.alpha = 0.65;
                    data.r = data.originalR;
                    data.g = data.originalG;
                    data.b = data.originalB;
                }
                // GIAI ĐOẠN 0s -> 3.5s: BÒ TỪ TÂM RA NGOÀI SIÊU CHẬM (TỐC ĐỘ NỞ CHẬM LẠI HƠN NỮA)
                else {
                    data.angle += data.speed * 0.7;

                    // Tiến trình nở từ tâm ra ngoài kéo dài 3.5 giây
                    if (timeInSeconds > data.crawlDelay) {
                        data.crawlProgress = Math.min(1.0, data.crawlProgress + 0.0028); // BÒ SIÊU CHẬM
                    }
                    const easeCrawl = 1 - Math.pow(1 - data.crawlProgress, 2.8);

                    currentRadius = THREE.MathUtils.lerp(0.01, data.targetRadius, easeCrawl);
                    currentHeight = data.baseY + (data.targetYOffset * easeCrawl);

                    data.alpha = 0.20 + easeCrawl * 0.40;
                    data.r = data.originalR;
                    data.g = data.originalG;
                    data.b = data.originalB;
                }

                const headX = Math.cos(data.angle) * currentRadius + data.scatterOffsetX;
                const headY = currentHeight;
                const headZ = Math.sin(data.angle) * currentRadius + data.scatterOffsetZ;

                data.curHeadX = headX;
                data.curHeadY = headY;
                data.curHeadZ = headZ;

                data.burstX = headX;
                data.burstY = headY;
                data.burstZ = headZ;

                const idx = i * 3;
                vPos[idx] = headX;
                vPos[idx + 1] = headY;
                vPos[idx + 2] = headZ;

                vCol[idx] = data.r * 0.55 * data.alpha;
                vCol[idx + 1] = data.g * 0.55 * data.alpha;
                vCol[idx + 2] = data.b * 0.55 * data.alpha;

                if (data.hasStreak && this.streakMesh.visible) {
                    const dist3D = Math.sqrt(headX * headX + headY * headY + headZ * headZ);
                    const shrinkFactor = isScatteringFirst ? Math.max(0.65, 1.0 - (dist3D - 2.0) * 0.05) : 1.0;
                    const totalTrailAngle = data.speed * 8.5 * shrinkFactor;

                    let prevX = headX;
                    let prevY = headY;
                    let prevZ = headZ;

                    for (let seg = 1; seg <= this.segmentsPerStreak; seg++) {
                        const segFrac = seg / this.segmentsPerStreak;
                        const tAngle = data.angle - totalTrailAngle * segFrac;

                        const tX = Math.cos(tAngle) * currentRadius + data.scatterOffsetX;
                        const tY = headY;
                        const tZ = Math.sin(tAngle) * currentRadius + data.scatterOffsetZ;

                        sPos[sIdx * 6] = prevX;
                        sPos[sIdx * 6 + 1] = prevY;
                        sPos[sIdx * 6 + 2] = prevZ;

                        sPos[sIdx * 6 + 3] = tX;
                        sPos[sIdx * 6 + 4] = tY;
                        sPos[sIdx * 6 + 5] = tZ;

                        const fadeHead = 1.0 - (seg - 1) * 0.22;
                        const fadeTail = 1.0 - seg * 0.22;

                        sCol[sIdx * 6] = data.r * fadeHead * 0.55 * data.alpha;
                        sCol[sIdx * 6 + 1] = data.g * fadeHead * 0.55 * data.alpha;
                        sCol[sIdx * 6 + 2] = data.b * fadeHead * 0.55 * data.alpha;

                        sCol[sIdx * 6 + 3] = data.r * fadeTail * 0.55 * data.alpha;
                        sCol[sIdx * 6 + 4] = data.g * fadeTail * 0.55 * data.alpha;
                        sCol[sIdx * 6 + 5] = data.b * fadeTail * 0.55 * data.alpha;

                        aPos[aIdx * 3] = tX;
                        aPos[aIdx * 3 + 1] = tY;
                        aPos[aIdx * 3 + 2] = tZ;

                        aCol[aIdx * 3] = data.r * fadeTail * 0.35 * data.alpha;
                        aCol[aIdx * 3 + 1] = data.g * fadeTail * 0.35 * data.alpha;
                        aCol[aIdx * 3 + 2] = data.b * fadeTail * 0.35 * data.alpha;

                        prevX = tX;
                        prevY = tY;
                        prevZ = tZ;

                        sIdx++;
                        aIdx++;
                    }
                }
            }
        }

        this.vortexGeometry.attributes.position.needsUpdate = true;
        this.vortexGeometry.attributes.color.needsUpdate = true;

        if (this.streakMesh.visible) {
            this.streakGeometry.attributes.position.needsUpdate = true;
            this.streakGeometry.attributes.color.needsUpdate = true;

            this.streakAuraGeometry.attributes.position.needsUpdate = true;
            this.streakAuraGeometry.attributes.color.needsUpdate = true;
        }
    }
}