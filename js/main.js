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
// BỘ VẼ CHỮ HẠT LẤP LÁNH CHUẨN UI NGANG TRÊN NỀN ĐEN DỌC
// ==========================================================
class LockScreenLandscapeParticles {
    constructor(text = "✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄❤️") {
        this.text = text;
        this.particles = [];
        this.textY = 0;
        this.speed = 1.8; // Tốc độ trôi từ dưới lên

        let canvas = document.getElementById('lock-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'lock-canvas';
            const container = document.getElementById('rotate-lock-screen') || document.body;
            container.appendChild(canvas);
        }

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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Chiều dài theo hướng ngang của UI Ngang (chính là chiều cao màn hình dọc)
        this.landscapeWidth = Math.max(window.innerWidth, window.innerHeight);
        this.landscapeHeight = Math.min(window.innerWidth, window.innerHeight);

        // Xuất hiện ngay ở nửa dưới khung ngang
        this.textY = this.landscapeHeight * 0.35;
        this.sampleTextParticles();
    }

    sampleTextParticles() {
        // 1. Canvas phụ đo và vẽ chữ độ phân giải cao
        const off = document.createElement('canvas');
        off.width = 1600;
        off.height = 180;
        const offCtx = off.getContext('2d');

        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, off.width, off.height);

        // Font chữ to, đậm nét
        const fSize = 46;
        offCtx.font = `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        const metrics = offCtx.measureText(this.text);

        offCtx.fillStyle = '#FFFFFF';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(this.text, off.width / 2, off.height / 2);

        const imgData = offCtx.getImageData(0, 0, off.width, off.height).data;
        this.particles = [];

        // Co dãn vừa khít 90% chiều dài điện thoại
        const textPixelWidth = metrics.width || 900;
        const scale = Math.min(1.0, (this.landscapeWidth * 0.90) / textPixelWidth);

        // 2. Quét điểm ảnh trích xuất thành hàng ngàn hạt bụi sao
        const step = 3;
        for (let y = 0; y < off.height; y += step) {
            for (let x = 0; x < off.width; x += step) {
                const idx = (y * off.width + x) * 4;
                if (imgData[idx] > 50) {
                    this.particles.push({
                        offsetX: (x - off.width / 2) * scale,
                        offsetY: (y - off.height / 2) * scale,
                        baseSize: 1.5 + Math.random() * 1.5,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }
        }
    }

    animate() {
        // Chỉ vẽ khi đang ở màn hình dọc
        if (window.innerWidth <= window.innerHeight || window.innerWidth < 900) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();

            // ==========================================================
            // MA TRẬN XOAY CHUẨN XÁC: ĐẶT TÂM CHÍNH GIỮA MÀN HÌNH VÀ XOAY 90 ĐỘ
            // ==========================================================
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(-Math.PI / 2); // Xoay 90 độ ngược chiều kim đồng hồ theo UI Ngang

            // Chữ trôi từ mép dưới lên mép trên của UI Ngang
            this.textY -= this.speed;
            const limit = this.landscapeHeight / 2 + 50;
            if (this.textY < -limit) {
                this.textY = limit; // Vòng lại mép dưới
            }

            const now = performance.now() * 0.001;

            // 1. VẼ THÂN CHỮ MỜ ĐỂ LUÔN THẤY RÕ NỘI DUNG
            const displayFontSize = Math.max(14, Math.floor(this.landscapeWidth * 0.035));
            this.ctx.font = `bold ${displayFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'rgba(255, 92, 158, 0.35)';
            this.ctx.fillText(this.text, 0, this.textY);

            // 2. VẼ HÀNG NGÀN HẠT BỤI SAO LẤP LÁNH ĐÍNH TRÊN TỪNG NÉT CHỮ
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                const px = p.offsetX;
                const py = this.textY + p.offsetY;

                const twinkle = Math.sin(now * 4.0 + p.phase) * 0.35;
                const alpha = Math.max(0.35, Math.min(1.0, 0.78 + twinkle));
                const size = p.baseSize * (0.85 + twinkle * 0.28);

                this.ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// KHỞI CHẠY TRỰC TIẾP
new LockScreenLandscapeParticles("✨ Úm ba la xì bùa, lật ngang điện thoại dính bùa dễ thương! 🪄❤️");