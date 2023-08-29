import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: './index.html',
                ParticleImg: './Page/ParticleImg.html',
            }
        }
    },
    css: {
        devSourcemap: true
    }
})