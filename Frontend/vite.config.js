import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    //host: "172.16.105.172",
    //host: "localhost",
    host:"192.168.100.98",
    //host:"192.168.18.196",
    port: 5173,
    strictPort: true
  }
})
