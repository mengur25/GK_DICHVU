import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true, // cho phép truy cập từ domain bên ngoài
    port: 5173,
    allowedHosts: [
      'myapp.vn',         // domain bạn muốn dùng
      'myapp.local.vn',   // nếu bạn dùng domain ảo khác
      '127.0.0.1',        // localhost mặc định
      'localhost'
    ]
  }

})