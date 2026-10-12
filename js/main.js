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
// BỘ VẼ CHỮ GHÉP TỪ CÁC HẠT LẤP LÁNH BAY TỪ DƯỚI LÊN TRÊN
// ==========================================================
class LockScreenParticleText {
    constructor(customText = "✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄 ❤️") {
        this.canvas = document.getElementById('lock-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.text = customText;
        this.textY = 0;
        this.speed = 1.2;
        this.isRunning = false;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.start();
    }

    resize() {
        if (!this.canvas) return;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        // Xuất hiện ngay ở nửa dưới màn hình để thấy ngay lập tức
        this.textY = this.height * 0.75;
        this.sampleTextParticles();
    }

    sampleTextParticles() {
        if (!this.width || !this.height) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.width;
        offCanvas.height = 160;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = '#000';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // KÍCH THƯỚC CHỮ TỰ ĐỘNG VỪA VẶN TRÊN 1 HÀNG MÀN HÌNH ĐIỆN THOẠI
        const fontSize = Math.min(28, Math.max(18, Math.floor(this.width * 0.065)));
        offCtx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        offCtx.fillStyle = '#fff';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';

        // VẼ NỘI DUNG CHỮ
        offCtx.fillText(this.text, offCanvas.width / 2, offCanvas.height / 2);

        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
        this.particles = [];

        // Trích xuất các pixel chữ thành từng hạt lấp lánh
        const step = 3;
        for (let y = 0; y < offCanvas.height; y += step) {
            for (let x = 0; x < offCanvas.width; x += step) {
                const idx = (y * offCanvas.width + x) * 4;
                if (imgData[idx] > 110) { // Điểm ảnh chữ
                    this.particles.push({
                        offsetX: x - offCanvas.width / 2,
                        offsetY: y - offCanvas.height / 2,
                        baseSize: 1.2 + Math.random() * 1.5,
                        twinklePhase: Math.random() * Math.PI * 2,
                        twinkleSpeed: 0.04 + Math.random() * 0.06
                    });
                }
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        // Nếu xoay ngang máy -> Dừng vẽ để tiết kiệm pin
        if (window.innerWidth > window.innerHeight) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Chữ bay từ dưới lên trên
        this.textY -= this.speed;
        if (this.textY < -80) {
            this.textY = this.height + 40; // Bay hết lên trên thì quay lại đáy
        }

        const centerX = this.width / 2;
        const now = performance.now() * 0.001;

        // VẼ HÀNG TRĂM HẠT BỤI SAO GHÉP THÀNH CHỮ
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const px = centerX + p.offsetX;
            const py = this.textY + p.offsetY;

            const twinkle = Math.sin(now * 3.5 + p.twinklePhase) * 0.35;
            const alpha = Math.max(0.35, Math.min(1.0, 0.75 + twinkle));
            const size = p.baseSize * (0.85 + twinkle * 0.25);

            // Hạt phát quang hồng baby neon
            this.ctx.fillStyle = `rgba(255, 92, 158, ${alpha})`;
            this.ctx.shadowColor = '#ff5c9e';
            this.ctx.shadowBlur = 8;

            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}


new LockScreenParticleText("✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄 ❤️");
