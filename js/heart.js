import * as THREE from 'three';
import { CONFIG } from './config.js';
import { HeartParticle } from './particle.js';
import { createGlowTexture } from './utils.js';

// HỆ SỐ TỐC ĐỘ 
const TIME_SCALE = 0.8;

export const BABY_NEON_PINK_COLORS = [
    new THREE.Color(0xFF5C9E),
    new THREE.Color(0xFF6FA5),
    new THREE.Color(0xFF4D8D),
    new THREE.Color(0xFF7EB3),
    new THREE.Color(0xFF66AA),
    new THREE.Color(0xFF5599),
    new THREE.Color(0xFF85BA),
    new THREE.Color(0xFF4081)
];

// HÀM LẤY MẪU CHỮ NGHIÊNG THƯ PHÁP 
function generateTextCoordinates(text, count = 4500, scale = 0.0095, offsetY = 0.25) {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 700 135px "Great Vibes", "Brush Script MT", cursive, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const validPixels = [];

    const step = 3;
    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const idx = (y * canvas.width + x) * 4;
            if (data[idx] > 110) {
                validPixels.push({
                    x: (x - canvas.width / 2) * scale,
                    y: -(y - canvas.height / 2) * scale + offsetY,
                    z: (Math.random() - 0.5) * 0.15
                });
            }
        }
    }

    const points = [];
    for (let i = 0; i < count; i++) {
        if (validPixels.length > 0) {
            const base = validPixels[i % validPixels.length];
            points.push({
                x: base.x + (Math.random() - 0.5) * 0.03,
                y: base.y + (Math.random() - 0.5) * 0.03,
                z: base.z + (Math.random() - 0.5) * 0.03
            });
        } else {
            points.push({ x: 0, y: offsetY, z: 0 });
        }
    }
    return points;
}

export class Heart {
    constructor() {
        this.group = new THREE.Group();
        this.pulseTime = 0;
        this.pulse = 1;
        this.simTime = 0;
        this.globalState = 'forming';

        this.pinkParticles = [];
        this.redParticles = [];

        this.babyNeonGlow = createGlowTexture(0xFF5C9E, 128);

        this.vortexData = [];
        this.segmentsPerStreak = 6;
        this.activeStreakHeads = []; // LƯU TỌA ĐỘ ĐẦU VỆT SÁNG ĐANG BAY ĐỂ TÍNH VA CHẠM THỰC TẾ

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

        const textMissYou = generateTextCoordinates('I Miss You', count, 0.0095, 0.25);
        const textLoveYou = generateTextCoordinates('I Love You', count, 0.0095, 0.25);

        // ==========================================================
        // 2. KHỞI TẠO CÁC HẠT TIM
        // ==========================================================
        const pinkCoords = [];
        const redCoords = [];

        for (let i = 0; i < count; i++) {
            const pt = rawCoords[i];
            const isPink = Math.random() > 0.4;
            const t1 = textMissYou[i];
            const t2 = textLoveYou[i];

            if (isPink) {
                const p = new HeartParticle(pt.x, pt.y, pt.z, t1, t2, true, minY, maxY, i);
                this.pinkParticles.push(p);
                pinkCoords.push(p.x, p.y, p.z);
            } else {
                const p = new HeartParticle(pt.x, pt.y, pt.z, t1, t2, false, minY, maxY, i);
                this.redParticles.push(p);
                redCoords.push(p.x, p.y, p.z);
            }
        }

        this.pinkGeometry = new THREE.BufferGeometry();
        this.pinkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pinkCoords, 3));
        this.pinkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(this.pinkParticles.length * 3), 3));
        this.pinkPoints = new THREE.Points(this.pinkGeometry, new THREE.PointsMaterial({
            size: 0.14,
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
            size: 0.13,
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        }));
        this.redPoints.renderOrder = 100;
        this.group.add(this.redPoints);

        // ==========================================================
        // 3. VÒNG XOÁY ĐÁY (180 VỆT BAN ĐẦU)
        // ==========================================================
        const vortexCount = 1400;
        const STREAK_COUNT = 700; // SỐ LƯỢNG VỆT SÁNG BAN ĐẦU Ở ĐĨA VÀ KHI TUNG RA

        const vPositions = new Float32Array(vortexCount * 3);
        const vColors = new Float32Array(vortexCount * 3);

        const streakPositions = [];
        const streakColors = [];
        const auraPositions = [];
        const auraColors = [];

        const colorBasePink = new THREE.Color(0xFF5C9E);
        const colorBaseRed = new THREE.Color(0xFF6FA5);

        const diskMinR = 0.08;
        const diskMaxR = 2.15;

        for (let i = 0; i < vortexCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const rNorm = Math.random();
            const baseRadius = diskMinR + rNorm * (diskMaxR - diskMinR);
            const targetYOffset = (Math.random() - 0.5) * 0.26;

            const speed = 0.015 + Math.random() * 0.025;
            const chosenColor = Math.random() > 0.4 ? colorBasePink : colorBaseRed;
            const hasStreak = i < STREAK_COUNT;

            const radialFreq = 1.2 + Math.random() * 2.8;
            const radialPhase = Math.random() * Math.PI * 2;
            const radialAmp = 0.12 + Math.random() * 0.25;

            const theta = angle + (Math.random() - 0.5) * 0.6;
            const phi = (Math.random() - 0.5) * Math.PI * 0.85;
            const baseScatterSpeed = 0.075 + Math.random() * 0.085;

            const initialColorProgress = (i * 0.618033) * BABY_NEON_PINK_COLORS.length;

            const initialScatterVx = Math.cos(phi) * Math.cos(theta) * baseScatterSpeed;
            const initialScatterVy = Math.sin(phi) * baseScatterSpeed * 1.15;
            const initialScatterVz = Math.cos(phi) * Math.sin(theta) * baseScatterSpeed;

            const heartTargetY = -1.4 + Math.random() * 2.65;
            const heartBoundRadius = (1.5 - Math.abs(heartTargetY - 0.1) * 0.45) * (0.35 + Math.random() * 0.5);

            this.vortexData.push({
                index: i,
                angle,
                baseRadius,
                diskMinR,
                diskMaxR,
                radialFreq,
                radialPhase,
                radialAmp,
                targetYOffset,
                crawlProgress: 0.0,
                crawlDelay: (i / vortexCount) * 1.5,
                speed,
                baseY: orbY,

                heartTargetY,
                heartBoundRadius,

                originalR: chosenColor.r,
                originalG: chosenColor.g,
                originalB: chosenColor.b,
                r: chosenColor.r,
                g: chosenColor.g,
                b: chosenColor.b,
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
                const fadeStep = 1.0 / this.segmentsPerStreak;
                for (let k = 0; k < this.segmentsPerStreak; k++) {
                    streakPositions.push(0, 0, 0, 0, 0, 0);
                    const fadeHead = 1.0 - k * fadeStep;
                    const fadeTail = 1.0 - (k + 1) * fadeStep;
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
            size: 0.72,    //kích thước  đầu vệt sáng 
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
            opacity: 0.78
        }));
        this.streakMesh.renderOrder = 2;
        this.group.add(this.streakMesh);

        this.streakAuraGeometry = new THREE.BufferGeometry();
        this.streakAuraGeometry.setAttribute('position', new THREE.Float32BufferAttribute(auraPositions, 3));
        this.streakAuraGeometry.setAttribute('color', new THREE.Float32BufferAttribute(auraColors, 3));
        this.streakAuraPoints = new THREE.Points(this.streakAuraGeometry, new THREE.PointsMaterial({
            size: 0.86,    //kích thước vệt sáng 
            map: this.babyNeonGlow,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
            opacity: 0.58
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
            const speed = (0.04 + Math.random() * 0.07) * TIME_SCALE;

            data.burstVx = Math.cos(phi) * Math.cos(theta) * speed;
            data.burstVy = Math.sin(phi) * speed + 0.005 * TIME_SCALE;
            data.burstVz = Math.cos(phi) * Math.sin(theta) * speed;
        }
    }

    update() {
        this.group.rotation.y += CONFIG.HEART.ROTATION_SPEED_Y * TIME_SCALE;
        this.pulseTime += 0.028 * TIME_SCALE;

        const beatCycle = this.pulseTime % (Math.PI * 2);
        if (beatCycle < Math.PI * 0.4) {
            this.pulse = 1 + 0.12 * Math.sin((beatCycle / (Math.PI * 0.4)) * Math.PI);
        } else if (beatCycle < Math.PI * 0.8) {
            this.pulse = 1 + 0.05 * Math.sin(((beatCycle - Math.PI * 0.4) / (Math.PI * 0.4)) * Math.PI);
        } else {
            this.pulse = 1;
        }

        this.simTime += (1 / 60) * TIME_SCALE;
        const TOTAL_CYCLE = 15.0;
        const timeInSeconds = this.simTime % TOTAL_CYCLE;

        const isAscendingPhase = timeInSeconds >= 3.2 && timeInSeconds < 4.4;
        const isImpactAndScatter = timeInSeconds >= 4.4 && timeInSeconds < 12.0;

        if (timeInSeconds < (1 / 60) * TIME_SCALE) {
            this.globalState = 'forming';
            this.streakMesh.visible = true;
            this.streakAuraPoints.visible = true;
            this.pinkParticles.forEach(p => p.reset());
            this.redParticles.forEach(p => p.reset());
            this.vortexData.forEach(d => d.reset());
        }
        else if (timeInSeconds >= 10.5 && timeInSeconds < 12.0) {
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

        // THU THẬP TỌA ĐỘ ĐẦU CÁC VỆT ĐANG BAY LÊN ĐỂ TÍNH VA CHẠM THỰC TẾ
        this.activeStreakHeads = [];
        if (isAscendingPhase) {
            for (let i = 0; i < this.vortexData.length; i++) {
                const d = this.vortexData[i];
                // Chỉ lấy 5/6 số vệt đang thực sự bay lên (vệt chẵn)
                if (d.hasStreak && (i % 2 === 0) && d.flyProgress > 0.05) {
                    this.activeStreakHeads.push({ x: d.curHeadX, y: d.curHeadY, z: d.curHeadZ });
                }
            }
        }

        // 1. CẬP NHẬT HẠT TIM (VA CHẠM 3D THỰC TẾ VỚI VỆT SÁNG)
        const pinkPos = this.pinkGeometry.attributes.position.array;
        const pinkCol = this.pinkGeometry.attributes.color.array;
        for (let i = 0; i < this.pinkParticles.length; i++) {
            const p = this.pinkParticles[i];
            p.update(this.pulse, this.globalState, timeInSeconds, TIME_SCALE, this.activeStreakHeads);
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
            p.update(this.pulse, this.globalState, timeInSeconds, TIME_SCALE, this.activeStreakHeads);
            const idx = i * 3;
            redPos[idx] = p.x; redPos[idx + 1] = p.y; redPos[idx + 2] = p.z;
            redCol[idx] = p.r * p.opacity; redCol[idx + 1] = p.g * p.opacity; redCol[idx + 2] = p.b * p.opacity;
        }
        this.redGeometry.attributes.position.needsUpdate = true;
        this.redGeometry.attributes.color.needsUpdate = true;

        // 2. CẬP NHẬT VÒNG XOÁY (BAY LÊN TIÊU GIẢM 5/6 VỆT -> TUNG RA ĐẦY ĐỦ 100% VỆT)
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
                data.burstVx *= Math.pow(0.985, TIME_SCALE);
                data.burstVy *= Math.pow(0.985, TIME_SCALE);
                data.burstVz *= Math.pow(0.985, TIME_SCALE);
                data.burstVy -= 0.0003 * TIME_SCALE;

                data.burstX += data.burstVx;
                data.burstY += data.burstVy;
                data.burstZ += data.burstVz;

                data.alpha = Math.max(0.0, data.alpha - 0.0075 * TIME_SCALE);

                const idx = i * 3;
                vPos[idx] = data.burstX;
                vPos[idx + 1] = data.burstY;
                vPos[idx + 2] = data.burstZ;

                vCol[idx] = data.originalR * 0.75 * data.alpha;
                vCol[idx + 1] = data.originalG * 0.75 * data.alpha;
                vCol[idx + 2] = data.originalB * 0.75 * data.alpha;
            }
            else {
                let currentRadius;
                let currentHeight;

                // 4.4s+: TUNG TOÁN LOẠN RA NGOÀI 3D (ĐẦY ĐỦ 100% SỐ LƯỢNG VỆT BAN ĐẦU)
                if (isImpactAndScatter) {
                    const scatterElapsed = timeInSeconds - 4.4;
                    const burstImpulse = Math.max(1.0, 3.2 - scatterElapsed * 3.5);

                    data.scatterOffsetX += data.scatterVx * burstImpulse * TIME_SCALE;
                    data.scatterOffsetY += data.scatterVy * burstImpulse * TIME_SCALE;
                    data.scatterOffsetZ += data.scatterVz * burstImpulse * TIME_SCALE;

                    data.scatterVx *= Math.pow(0.993, TIME_SCALE);
                    data.scatterVy *= Math.pow(0.993, TIME_SCALE);
                    data.scatterVz *= Math.pow(0.993, TIME_SCALE);

                    data.angle += data.speed * 0.45 * TIME_SCALE;

                    const safeClearance = Math.min(1.0, scatterElapsed * 4.0) * 1.8;
                    currentRadius = data.baseRadius * 0.5 + safeClearance;
                    currentHeight = data.baseY + data.scatterOffsetY;

                    // PHỤC HỒI 100% SỐ VỆT KHI BUNG TOÁN LOẠN RA NGOÀI
                    data.alpha = 1.0;
                    data.r = data.originalR;
                    data.g = data.originalG;
                    data.b = data.originalB;
                }
                // 3.2s -> 4.4s: BAY LÊN TIM 
                else if (isAscendingPhase) {
                    data.flyProgress = Math.min(1.0, data.flyProgress + 0.0085 * TIME_SCALE);
                    const t = data.flyProgress;
                    const easeT = 1 - Math.pow(1 - t, 2.5);

                    data.angle += data.speed * 0.85 * TIME_SCALE;

                    currentRadius = THREE.MathUtils.lerp(data.baseRadius, data.heartBoundRadius * 1.05, easeT);
                    currentHeight = (data.baseY + data.targetYOffset) + (data.heartTargetY - (data.baseY + data.targetYOffset)) * easeT;

                    // TIÊU GIẢM 3/4 SỐ VỆT: Chỉ cho vệt chẵn hiển thị bay lên, vệt lẻ ẩn đi
                    const isRisingStreakVisible = (i % 6 === 0);
                    data.alpha = isRisingStreakVisible ? 0.75 : 0.0;

                    data.r = data.originalR;
                    data.g = data.originalG;
                    data.b = data.originalB;
                }
                // 0s -> 3.2s: Ở ĐĨA ĐÁY NỞ RA TỪ TÂM (ĐẦY ĐỦ 100% VỆT)
                else {
                    data.angle += data.speed * 0.9 * TIME_SCALE;

                    if (timeInSeconds > data.crawlDelay) {
                        data.crawlProgress = Math.min(1.0, data.crawlProgress + 0.0035 * TIME_SCALE);
                    }
                    const easeCrawl = 1 - Math.pow(1 - data.crawlProgress, 2.8);

                    const radialWander = Math.sin(this.simTime * data.radialFreq + data.radialPhase) * data.radialAmp;
                    const rawR = THREE.MathUtils.lerp(0.04, data.baseRadius + radialWander, easeCrawl);
                    currentRadius = THREE.MathUtils.clamp(rawR, 0.04, data.diskMaxR);
                    currentHeight = data.baseY + (data.targetYOffset * easeCrawl);

                    const centerDimmer = Math.min(1.0, currentRadius / 0.55);
                    data.alpha = (0.20 + easeCrawl * 0.45) * centerDimmer;
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

                vCol[idx] = data.r * 0.75 * data.alpha;
                vCol[idx + 1] = data.g * 0.75 * data.alpha;
                vCol[idx + 2] = data.b * 0.75 * data.alpha;

                if (data.hasStreak && this.streakMesh.visible) {
                    const dist3D = Math.sqrt(headX * headX + headY * headY + headZ * headZ);
                    const shrinkFactor = isImpactAndScatter ? Math.max(0.65, 1.0 - (dist3D - 2.0) * 0.05) : 1.0;

                    const totalTrailAngle = data.speed * 18.0 * shrinkFactor;   //độ dài vệt sáng 
                    const fadeStep = 1.0 / this.segmentsPerStreak;

                    let prevX = headX;
                    let prevY = headY;
                    let prevZ = headZ;

                    for (let seg = 1; seg <= this.segmentsPerStreak; seg++) {
                        const segFrac = seg / this.segmentsPerStreak;
                        let tX, tY, tZ;

                        if (isAscendingPhase) {
                            const verticalTrailDrop = 0.65 * segFrac;    //độ dài bay lên quyết định hướng 
                            const helixAngle = data.angle - (1.1 * segFrac);

                            tX = Math.cos(helixAngle) * currentRadius + data.scatterOffsetX;
                            tY = headY - verticalTrailDrop;
                            tZ = Math.sin(helixAngle) * currentRadius + data.scatterOffsetZ;
                        } else {
                            const tAngle = data.angle - totalTrailAngle * segFrac;
                            tX = Math.cos(tAngle) * currentRadius + data.scatterOffsetX;
                            tY = currentHeight;
                            tZ = Math.sin(tAngle) * currentRadius + data.scatterOffsetZ;
                        }

                        sPos[sIdx * 6] = prevX;
                        sPos[sIdx * 6 + 1] = prevY;
                        sPos[sIdx * 6 + 2] = prevZ;

                        sPos[sIdx * 6 + 3] = tX;
                        sPos[sIdx * 6 + 4] = tY;
                        sPos[sIdx * 6 + 5] = tZ;

                        const fadeHead = 1.0 - (seg - 1) * fadeStep;
                        const fadeTail = 1.0 - seg * fadeStep;

                        sCol[sIdx * 6] = data.r * fadeHead * 0.70 * data.alpha;
                        sCol[sIdx * 6 + 1] = data.g * fadeHead * 0.70 * data.alpha;
                        sCol[sIdx * 6 + 2] = data.b * fadeHead * 0.70 * data.alpha;

                        sCol[sIdx * 6 + 3] = data.r * fadeTail * 0.70 * data.alpha;
                        sCol[sIdx * 6 + 4] = data.g * fadeTail * 0.70 * data.alpha;
                        sCol[sIdx * 6 + 5] = data.b * fadeTail * 0.70 * data.alpha;

                        aPos[aIdx * 3] = tX;
                        aPos[aIdx * 3 + 1] = tY;
                        aPos[aIdx * 3 + 2] = tZ;

                        aCol[aIdx * 3] = data.r * fadeTail * 0.45 * data.alpha;
                        aCol[aIdx * 3 + 1] = data.g * fadeTail * 0.45 * data.alpha;
                        aCol[aIdx * 3 + 2] = data.b * fadeTail * 0.45 * data.alpha;

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