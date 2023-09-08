class Particle {
    effect: Effect; x: number; y: number; originX: number; originY: number; size: number; vx: number; vy: number; color: string; ease: number; dx: number; dy: number; distance: number; force: number; angle: number; friction: number;
    constructor(effect: Effect, x: number, y: number, color: string, ease: number, friction: number) {
        this.effect = effect; // Get reference to Effect class;
        this.x = x;
        this.y = y;
        this.originX = Math.floor(x);
        this.originY = Math.floor(y);
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.dx = 0;
        this.dy = 0;
        this.distance = 0;
        this.force = 0;
        this.angle = 0;
        this.size = this.effect.gap;
        this.ease = ease;
        this.friction = friction;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    update() {
        if (typeof this.effect.mouse.x === 'number') {
            this.dx = this.effect.mouse.x - this.x;
        }
        else {
            this.dx = this.effect.mouse.radius;
        }
        if (typeof this.effect.mouse.y === 'number') {
            this.dy = this.effect.mouse.y - this.y;
        }
        else {
            this.dy = this.effect.mouse.radius;
        }
        this.distance = this.dx * this.dx + this.dy * this.dy;
        this.force = -this.effect.mouse.radius / this.distance;

        if (this.distance < this.effect.mouse.radius) {
            this.angle = Math.atan2(this.dy, this.dx);
            this.vx += this.force * Math.cos(this.angle);
            this.vy += this.force * Math.sin(this.angle);
        }

        this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
        this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
    }
}

class Effect {
    canvas: HTMLCanvasElement; img: HTMLImageElement; ctx: CanvasRenderingContext2D; particlesArray: Particle[];
    centerX?: number; centerY?: number; x?: number; y?: number; gap: number; animationID?: number | undefined; checkAnimationEnd: number | undefined;
    mouse: { radius: number, x: number | undefined, y: number | undefined };
    settings: { particleSize?: number; ease?: number; friction?: number; radius?: number };
    constructor(container: {
        parent: HTMLElement;
        canvas_width: number;
        canvas_height: number;
        img_src: string;
    }, settings: {
        particleSize?: number,
        ease?: number,
        friction?: number,
        radius?: number,
    } = { particleSize: 5, ease: 0.1, friction: 0.9, radius: 3000 }) {
        this.settings = settings;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.img = document.createElement('img');
        this.appendCanvas(container.canvas_width, container.canvas_height, container.img_src, container.parent);
        this.particlesArray = [];
        this.gap = typeof settings.particleSize === 'number' ? settings.particleSize : 5;

        this.mouse = {
            radius: typeof settings.radius === 'number' ? settings.radius : 3000,
            x: undefined,
            y: undefined
        }
        this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY - this.canvas.getBoundingClientRect().top;
        })
        this.canvas.addEventListener('touchend', () => {
            this.mouse.x = undefined;
            this.mouse.y = undefined;
        });
        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            if(!this.animationID) this.animationID = requestAnimationFrame(this.animate);
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = undefined;
            this.mouse.y = undefined;
            if(!this.checkAnimationEnd) this.checkAnimationEnd = setInterval(() => {
                const isNotInViewport = () => { 
                    const rect = this.canvas.getBoundingClientRect();
                    return (
                        rect.bottom <= 0 ||
                        rect.top > (window.innerHeight || document.documentElement.clientHeight)
                    );
                }
                let end = this.particlesArray.every((particle) => {  
                    return (Math.round(particle.x) === particle.originX && Math.round(particle.y) === particle.originY)
                });
                if (end || isNotInViewport()) { 
                    clearInterval(this.checkAnimationEnd);
                    this.checkAnimationEnd = undefined;
                    if (this.animationID) cancelAnimationFrame(this.animationID);
                    this.animationID = undefined;   
                    if (isNotInViewport()) {
                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        this.particlesArray = [];        
                        this.init();
                    }
                }
            }, 17);
        })

        this.animate = this.animate.bind(this);
    }
    init() {
        this.ctx.drawImage(
            this.img, 
            this.x === undefined ? 0 : this.x, 
            this.y === undefined? 0 : this.y
        );
        const pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        for (let y = 0; y < this.canvas.height; y += this.gap) {
            for (let x = 0; x < this.canvas.width; x += this.gap) {
                const i = (y * this.canvas.width + x) * 4;
                const RED = pixels[i];
                const GREEN = pixels[i + 1];
                const BLUE = pixels[i + 2];
                const alpha = pixels[i + 3];
                const color = `rgb(${RED}, ${GREEN}, ${BLUE})`;
                if (alpha > 0) {
                    this.particlesArray.push(new Particle(
                        this,
                        x,
                        y,
                        color,
                        typeof this.settings.ease === 'number' ? this.settings.ease : 0.1,
                        typeof this.settings.friction === 'number' ? this.settings.friction : 0.9
                    ));
                }
            }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawParticles();
        this.updateParticles();
    }
    drawParticles() {
        this.particlesArray.forEach((particle) => {
            particle.draw(this.ctx);
        })
    }
    updateParticles() {
        this.particlesArray.forEach((particle) => {
            particle.update();
        })
    }
    appendCanvas(width: number, height: number, src: string, parent: HTMLElement) {
        this.img.src = src;
        this.canvas.width = width;
        this.canvas.height = height;
        this.img.addEventListener('load', () => {
            // Center the image in canvas:
            this.centerX = this.canvas.width * 0.5;
            this.centerY = this.canvas.height * 0.5;
            this.x = this.centerX - this.img.width * 0.5;
            this.y = this.centerY - this.img.height * 0.5;
            this.init();
        })
        this.img.addEventListener('error', () => {
            this.ctx.font = "48px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("Image src doesn't exist", this.canvas.width / 2, this.canvas.height / 2);
        })
        // Default styles:
        parent.append(this.canvas, this.img);
        parent.style.display = 'flex';
        parent.style.justifyContent = 'center';
        parent.style.overflow = 'hidden';
        this.canvas.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.img.style.display = 'none';
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawParticles();
        this.updateParticles();
        this.animationID = requestAnimationFrame(this.animate);
    }
    setGap(particle_size: number){
        if(typeof particle_size === 'number'){
            if(this.animationID){
                cancelAnimationFrame(this.animationID);
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.gap = Math.floor(particle_size);
            this.particlesArray = [];
            this.init();
        }     
    }
    setFriction(value: number){
        if(typeof value === 'number'){
            this.particlesArray.forEach((particle) => particle.friction = value)
        }
    }
    setEase(value: number){
        if(typeof value === 'number'){
            this.particlesArray.forEach((particle) => particle.ease = value)
        }
    }
    setRadius(value: number){
        if(typeof value === 'number'){
            this.mouse.radius = Math.floor(value);
        }
    }
}

export { Effect }