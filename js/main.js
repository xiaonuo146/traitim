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
        const aspect = window.innerWidth / window.innerHeight;
        const baseZ = CONFIG.CAMERA.BASE_Z;
        this.baseCameraZ = aspect < 1 ? baseZ / aspect : baseZ;
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