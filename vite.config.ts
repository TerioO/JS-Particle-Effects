import { defineConfig } from 'vite'

export default defineConfig({
    base: '/JS-Particle-Effects',
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