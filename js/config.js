export const CONFIG = {
    // 1. BẢNG MÀU ĐỒNG BỘ TOÀN DỰ ÁN
    COLORS: {
        BACKGROUND: 0x0B0C10,     // Màu nền đen vũ trụ
        PINK: 0xFF1493,           // Màu hạt hồng cánh sen chính
        RED: 0xFF69B4,            // Màu hạt hồng sáng xen kẽ
        AMB_PARTICLE: 0xFFA0C0     // Bụi hồng phấn lơ lửng xung quanh
    },

    // 2. CẤU HÌNH TRÁI TIM 3D
    HEART: {
        PARTICLE_COUNT: 4500,     // 4500 hạt giúp tim đầy đặn
        BASE_SCALE: 0.065,        // Tỉ lệ khối tim
        ROTATION_SPEED_Y: 0.010,  // Tốc độ xoay ngang
        ORB_Y: -2.2,              // Vị trí đĩa xoáy đáy
        PARTICLE_SIZE_PINK: 0.09, // Kích cỡ hạt hồng
        PARTICLE_SIZE_RED: 0.08   // Kích cỡ hạt xen kẽ
    },

    // 3. CẤU HÌNH BỤI KHÔNG GIAN (AMBIENT)
    AMBIENT: {
        PARTICLE_COUNT: 180,      // Số hạt bụi nền trôi nổi
        SIZE: 0.065               // Kích thước hạt bụi nền
    },

    // 4. CẤU HÌNH CAMERA & GÓC NHÌN
    CAMERA: {
        FOV: 60,
        BASE_Z: 6.8
    }
};