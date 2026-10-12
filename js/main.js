import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Heart } from './heart.js';
import { AmbientParticles } from './background.js';

class Application {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.videoContainer = document.getElementById('video-container');
        this.introVideo = document.getElementById('intro-video');
        this.skipBtn = document.getElementById('skip-btn');

        this.musicClip = document.getElementById('music-clip');
        this.musicHeart = document.getElementById('music-heart');

        // BỘ NÚT ĐIỀU KHIỂN
        this.controls = document.getElementById('controls');
        this.toggleMusicBtn = document.getElementById('toggle-music-btn');
        this.toggleAnimBtn = document.getElementById('toggle-anim-btn');

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

        // CỜ KHÓA HOẠT ẢNH (CHỜ VIDEO HẾT MỚI CHẠY)
        this.is3DStarted = false;
        this.isPaused = false;

        this.initThree();
        this.setupMediaEvents();
        this.setupControlButtons();
    }

    setupMediaEvents() {
        // 1. Bấm nút Mở quà -> Mở video và phát nhạc 1
        this.startBtn.addEventListener('click', () => {
            // Mở khóa nhạc 2 trước
            if (this.musicHeart) {
                this.musicHeart.volume = 0;
                this.musicHeart.play().then(() => {
                    this.musicHeart.pause();
                    this.musicHeart.currentTime = 0;
                }).catch(() => { });
            }

            // Phát nhạc 1
            if (this.musicClip) {
                this.musicClip.volume = 0.8;
                this.musicClip.play().catch(() => { });
            }

            this.startScreen.classList.add('hidden');
            setTimeout(() => {
                this.startScreen.style.display = 'none';
            }, 800);

            this.videoContainer.classList.remove('hidden');
            this.introVideo.play().catch(() => { });
        });

        // 2. Video chạy hết -> Chuyển cảnh vào 3D
        this.introVideo.addEventListener('ended', () => {
            this.transitionTo3DScene();
        });

        // 3. Bấm Bỏ qua -> Chuyển cảnh vào 3D
        this.skipBtn.addEventListener('click', () => {
            this.introVideo.pause();
            this.transitionTo3DScene();
        });
    }

    setupControlButtons() {
        // NÚT BẬT / TẮT NHẠC 2
        this.toggleMusicBtn.addEventListener('click', () => {
            if (!this.musicHeart) return;
            if (this.musicHeart.paused) {
                this.musicHeart.play();
                this.toggleMusicBtn.textContent = '🔊';
            } else {
                this.musicHeart.pause();
                this.toggleMusicBtn.textContent = '🔇';
            }
        });

        // NÚT TẠM DỪNG / TIẾP TỤC HOẠT ẢNH 3D
        this.toggleAnimBtn.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            this.toggleAnimBtn.textContent = this.isPaused ? '▶️' : '⏸️';
        });
    }

    transitionTo3DScene() {
        // Tắt nhạc 1
        if (this.musicClip) {
            this.musicClip.pause();
            this.musicClip.currentTime = 0;
        }

        // Ẩn video
        this.videoContainer.classList.add('hidden');
        setTimeout(() => {
            this.videoContainer.style.display = 'none';
        }, 1500);

        // HIỆN CẢNH 3D VÀ BỘ ĐIỀU KHIỂN
        this.canvas.classList.add('visible');
        if (this.controls) {
            this.controls.classList.remove('hidden');
        }

        // BẬT NHẠC 2
        if (this.musicHeart) {
            this.musicHeart.volume = 0.8;
            this.musicHeart.play().catch(() => { });
        }

        // CHÍNH THỨC KÍCH HOẠT HOẠT ẢNH 3D BẮT ĐẦU CHẠY TỪ GIÂY THỨ 0
        this.is3DStarted = true;
        if (this.heart) {
            this.heart.simTime = 0; // Đặt mốc thời gian hoạt ảnh từ giây 0
        }
    }

    initThree() {
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
        const height = window.innerHeight;
        const baseZ = CONFIG.CAMERA.BASE_Z;

        // Khi xoay ngang điện thoại (chiều cao hẹp < 500px)
        if (height < 500) {
            this.baseCameraZ = baseZ * 1.05;
        } else {
            // Màn hình máy tính / iPad
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

        // CHỈ CẬP NHẬT HOẠT ẢNH KHI ĐÃ HẾT VIDEO VÀ KHÔNG Ở TRẠNG THÁI PAUSE
        if (this.is3DStarted && !this.isPaused) {
            while (this.accumulator >= this.fixedStep) {
                this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
                this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;

                if (this.heart) this.heart.update();
                if (this.ambient) this.ambient.update();

                this.accumulator -= this.fixedStep;
            }
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
// ==========================================================
// BỘ VẼ CHỮ HẠT LẤP LÁNH (ÉP VỊ TRÍ NỔI TRÊN CÙNG - HIỆN 100%)
// ==========================================================
class LockScreenParticleText {
    constructor(customText = "✨ ✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄 ❤️") {
        this.text = customText;
        this.particles = [];
        this.textY = 0;
        this.speed = 1.8; // Tốc độ trôi chữ

        // 1. TỰ TẠO VÀ ÉP VỊ TRÍ CANVAS NỔI TRÊN CÙNG MÀN HÌNH (Z-INDEX CAO NHẤT)
        let canvas = document.getElementById('lock-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'lock-canvas';
            const container = document.getElementById('rotate-lock-screen') || document.body;
            container.appendChild(canvas);
        }

        // ÉP CỨNG VỊ TRÍ PHỦ TOÀN MÀN HÌNH (KHÔNG BỊ FLEXBOX ĐẨY XUỐNG ĐÁY)
        canvas.style.cssText = "position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100dvh !important; z-index: 9999999 !important; pointer-events: none !important;";

        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        // Xuất hiện ngay ở nửa dưới màn hình để thấy ngay lập tức
        this.textY = this.height * 0.72;
        this.sampleTextParticles();
    }

    sampleTextParticles() {
        if (!this.width || !this.height) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = 1200;
        offCanvas.height = 250;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        offCtx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        offCtx.fillStyle = '#FFFFFF';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(this.text, offCanvas.width / 2, offCanvas.height / 2);

        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
        this.particles = [];

        // Tự co giãn theo chiều ngang màn hình (kể cả màn hình hẹp 238px trong ảnh)
        const targetWidth = Math.min(this.width * 0.90, 380);
        this.scale = targetWidth / (offCanvas.width * 0.70);

        const step = 4;
        for (let y = 0; y < offCanvas.height; y += step) {
            for (let x = 0; x < offCanvas.width; x += step) {
                const idx = (y * offCanvas.width + x) * 4;
                if (imgData[idx] > 50) {
                    this.particles.push({
                        offsetX: (x - offCanvas.width / 2) * this.scale,
                        offsetY: (y - offCanvas.height / 2) * this.scale,
                        baseSize: 1.8 + Math.random() * 1.6,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }
        }
    }

    animate() {
        // Chỉ vẽ khi màn hình dạng Dọc (Portrait)
        if (window.innerWidth <= window.innerHeight || window.innerWidth < 900) {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Chữ trôi từ dưới lên trên
            this.textY -= this.speed;
            if (this.textY < -60) {
                this.textY = this.height + 40;
            }

            const centerX = this.width / 2;
            const now = performance.now() * 0.001;

            // 1. VẼ THÂN CHỮ PHÁT QUANG RÕ RÀNG (ĐẢM BẢO NHÌN THẤY NGAY 100%)
            const fontSize = Math.max(13, Math.min(22, Math.floor(this.width * 0.055)));
            this.ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'rgba(255, 105, 180, 0.45)';
            this.ctx.shadowColor = '#ff5c9e';
            this.ctx.shadowBlur = 12;
            this.ctx.fillText(this.text, centerX, this.textY);

            // 2. VẼ HÀNG NGHÌN HẠT BỤI SAO LẤP LÁNH ĐÍNH TRÊN TỪNG NÉT CHỮ
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                const px = centerX + p.offsetX;
                const py = this.textY + p.offsetY;

                const twinkle = Math.sin(now * 4.5 + p.phase) * 0.35;
                const alpha = Math.max(0.4, Math.min(1.0, 0.80 + twinkle));
                const size = p.baseSize * (0.9 + twinkle * 0.3);

                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.shadowColor = '#ff5c9e';
                this.ctx.shadowBlur = 6;

                this.ctx.beginPath();
                this.ctx.arc(px, py, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// KHỞI CHẠY NGAY
new LockScreenParticleText("✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄❤️ ");