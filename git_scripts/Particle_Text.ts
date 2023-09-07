// TO DO:
//      - Make settings canvas_width: window.innerWidth work when loading on smaller viewport and then increasing viewport (Unless you're messing with devTools I don't think this is important)
//      - Add loading animation while canvas not rendered (noticeable when google fonts are loading)

class Particle {
    effect: Effect; color: string; originalColor: string; x: number; y: number; originX: number; originY: number; size: number; distance: number; dx: number; dy: number; vx: number; vy: number; force: number; angle: number; friction: number; ease: number;
    constructor(effect: Effect, x: number, y: number, color: string) {
        this.effect = effect;
        this.color = color;
        this.originalColor = color;
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.dx = 0;
        this.dy = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.force = 0;
        this.distance = 0;
        this.friction = this.effect.settings.particles?.friction ?? 0.8;
        this.ease = this.effect.settings.particles?.ease ?? 0.1;
        this.size = this.effect.particleSize;
    }
    draw() {
        if (Math.round(this.x) === this.originX && Math.round(this.y) === this.originY) {
            this.color = this.originalColor;
        } 
        else if (typeof this.effect.settings.particles?.trail_color === "string") {
            this.color = this.effect.settings.particles?.trail_color;
        }
        else if(this.effect.settings.particles?.trail_color === undefined) {
            this.color = this.originalColor;
        }
        this.effect.ctx.fillStyle = this.color;
        this.effect.ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    update() {
        let radius = this.effect.settings.particles?.radius ?? 3000;
        if (typeof this.effect.mouse.x === 'number') {
            this.dx = this.effect.mouse.x - this.x;
        }
        else {
            this.dx = radius;
        }
        if (typeof this.effect.mouse.y === 'number') {
            this.dy = this.effect.mouse.y - this.y;
        }
        else {
            this.dy = radius;
        }
        this.distance = this.dx * this.dx + this.dy * this.dy;
        this.force = -radius / this.distance;

        if (this.distance < radius) {
            this.angle = Math.atan2(this.dy, this.dx);
            this.vx += this.force * Math.cos(this.angle);
            this.vy += this.force * Math.sin(this.angle);
        }

        this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
        this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
    }
}


interface EffectSettings {
    text_max_width?: number, letter_spacing?: number, word_spacing?: number, color?: string, font_size?: number,
    font_family?: string, stroke_width?: number, stroke_color?: string,
    particles?: { size?: number, radius?: number, ease?: number, friction?: number, trail_color?: string; }
}

class Effect {
    canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; originalWidth: number; canvasMaxHeight?: number; text: string; padding?: number;
    textX: number; lineHeight: number; maxTextWidth: number; animationID?: number | undefined; checkAnimationEnd: number | undefined;
    particles: Particle[]; particleSize: number;
    mouse: { x: number | undefined, y: number | undefined };
    settings: EffectSettings;
    constructor(init: { parent: HTMLElement | null, canvas_width: number, canvas_max_height?: number, padding?: number, text: string, }, settings: EffectSettings) {
        // Default settings:
        settings.color = settings.color || "black";
        settings.font_family = settings.font_family || "serif";
        settings.font_size = settings.font_size || 16;
        settings.stroke_color = settings.stroke_color || "rgba(0, 0, 0, 0)";
        settings.stroke_width = settings.stroke_width || 1;
        settings.letter_spacing = settings.letter_spacing || undefined;
        settings.word_spacing = settings.word_spacing || undefined;
        settings.text_max_width = settings.text_max_width || 1;
        settings.particles = settings.particles || {};
        settings.particles.size = settings.particles.size || 3;
        settings.particles.radius = settings.particles.radius || 3000;
        settings.particles.ease = settings.particles.ease || 0.1;
        settings.particles.friction = settings.particles.friction || 0.8;
        settings.particles.trail_color = settings.particles.trail_color || undefined;
        this.settings = settings;

        // Canvas inits:
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.canvasMaxHeight = init.canvas_max_height;
        this.padding = init.padding;
        this.originalWidth = init.canvas_width;
        this.text = init.text;
        this.textX = init.canvas_width / 2;
        this.lineHeight = settings.font_size;
        this.maxTextWidth = Math.abs(settings.text_max_width) > 1 ? init.canvas_width : init.canvas_width * settings.text_max_width;
        this.particles = [];
        this.particleSize = typeof settings.particles.size === 'number' && settings.particles.size >= 1 ? Math.ceil(settings.particles.size) : 3;

        this.mouse = {
            x: undefined,
            y: undefined,
        }

        // Why bind animation loop?
        //  - When this.animate() first called, this is set properly and points to Effect class
        //  - When requestAnimationFrame() is reached and calls repeatedly the this.animate() method, it looses this context.
        //  - So on initail call, this = Effect
        //  - After requestAnimationFrame() calls this.animate() ==> this = undefined;
        this.animate = this.animate.bind(this);
        this.appendCanvas(init.parent, init.canvas_width, init.text);

        window.addEventListener('resize', () => {
            this.resize(window.innerWidth)
        })

        // For multiple Effects, it's important that animation runs only on the one the user interacts with it:
        // Add animation only when mouse enters canvas:
        this.canvas.addEventListener('mouseenter', () => {
            clearInterval(this.checkAnimationEnd);
            this.checkAnimationEnd = undefined;
            if (!this.animationID) this.animate();       // Only add animation if it doesn't exist
        })

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            if(!this.animationID) this.animate();
        })

        // When mouse leaves canvas, remove the animation:
        this.checkAnimationEnd = undefined;
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = undefined;
            this.mouse.y = undefined;
            this.checkAnimationEnd = setInterval(() => {
                // Should've made this a global function, since it might be useful for other situations.
                const isNotInViewport = () => { // Checks only for vertical visibility.
                    const rect = this.canvas.getBoundingClientRect();
                    return (
                        rect.bottom <= 0 ||
                        rect.top > (window.innerHeight || document.documentElement.clientHeight)
                    );
                }
                let end = this.particles.every((particle) => {  // Check that every particle has reached origin == animation finished
                    return (Math.round(particle.x) === particle.originX && Math.round(particle.y) === particle.originY)
                });
                if (end || isNotInViewport()) { // If canvas is outside viewport, remove animation immediately and return canvas to original state.
                    clearInterval(this.checkAnimationEnd);
                    if (this.animationID) cancelAnimationFrame(this.animationID);
                    this.animationID = undefined;   // Track the state of the animation, check for this in mouseenter handle!
                    if (isNotInViewport()) {        // Return particles to initial state 
                        this.wrapText(this.text); 
                        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        // this.particles.forEach((el) => {
                        //     if (el.color != el.originalColor) el.color = el.originalColor;
                        //     el.x = el.originX;
                        //     el.y = el.originY;
                        //     el.draw();
                        // })
                    }
                }
            }, 17);
        })
    }
    // [ Effect Methods ] -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    convertToParticles() {
        this.particles = [];
        const pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);  // Remove original text
        for (let y = 0; y < this.canvas.height; y += this.particleSize) {
            for (let x = 0; x < this.canvas.width; x += this.particleSize) {
                const i = (y * this.canvas.width + x) * 4;
                if (pixels[i + 3] === 0) continue;
                const color = `rgb(${pixels[i]}, ${pixels[i + 1]}, ${pixels[i + 2]})`;
                this.particles.push(new Particle(this, x, y, color));
                this.particles[this.particles.length - 1].draw();
            }
        }
    }
    render() {
        this.particles.forEach((particle) => {
            particle.draw();
            particle.update();
        })
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.render();
        this.animationID = requestAnimationFrame(this.animate);
    }
    appendCanvas(parent: HTMLElement | null, width: number, text: string) {
        if (parent instanceof HTMLElement) {
            this.canvas.width = width;
            this.wrapText(text);
            parent.style.display = 'flex';
            parent.style.overflow = 'hidden';
            parent.appendChild(this.canvas);
        }
    }
    wrapText(text: string) {
        const setCTX = () => {
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = `${this.settings.color}`;
            this.ctx.font = `${this.settings.font_size}px ${this.settings.font_family}`;
            this.ctx.strokeStyle = `${this.settings.stroke_color}`;
            this.ctx.lineWidth = this.settings.stroke_width ? this.settings.stroke_width : 1;
            if (this.settings.letter_spacing) {
                let temp_ctx = this.ctx as any;
                try {
                    temp_ctx.letterSpacing = this.settings.letter_spacing > 0 ? Math.floor(this.settings.letter_spacing) + 'px' : 0;
                }
                catch (e) {
                    console.log("Browser doesn't support canvas .letterSpacing property");
                }
            }
            if (this.settings.word_spacing) {
                let temp_ctx = this.ctx as any;
                try {
                    temp_ctx.wordSpacing = this.settings.word_spacing > 0 ? Math.floor(this.settings.word_spacing) + 'px' : 0;
                }
                catch (e) {
                    console.log("Browser doesn't support canvas .wordSpacing property")
                }
            }
        }

        // Set the ctx to properly calculate text dimensions:  
        setCTX();
        let linesArray: any = [];
        let words = text.split(' ');
        let lineCounter = 0;
        let line = '';
        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            if (this.ctx.measureText(testLine).width > this.maxTextWidth) {
                line = words[i] + ' ';
                lineCounter += 1;
            }
            else {
                line = testLine;
            }
            linesArray[lineCounter] = line;
        }
        let textHeight = this.lineHeight * lineCounter;

        // Checking for max height:
        let padding = typeof this.padding === 'number' ? Math.floor(Math.abs(this.padding)) : 0;
        if (this.canvasMaxHeight) {
            let tempHeight = this.lineHeight * (lineCounter + 1) + padding;
            if (tempHeight > this.canvasMaxHeight) {
                this.canvas.height = this.canvasMaxHeight;
            }
            else {
                this.canvas.height = tempHeight;
            }
        }
        else {
            this.canvas.height = this.lineHeight * (lineCounter + 1) + padding;
        }

        // Whenever canvas.height is changed, the ctx gets reset, so set it again:
        // IDK why this happens, I tried a couple of things but to no avail.
        // This way setCTX() is called twice before canvas is scanned so it should'nt be much of an issue.
        setCTX();
        let textY = this.canvas.height / 2 - textHeight / 2;
        linesArray.forEach((el, i) => {
            this.ctx.fillText(el, this.textX, textY + (i * this.lineHeight));
            this.ctx.strokeText(el, this.textX, textY + (i * this.lineHeight));
        })
        this.convertToParticles();
    }

    resize(innerWidth: number) {
        const reset = (textX: number) => {
            this.textX = textX / 2;
            if (this.settings.text_max_width) {
                this.maxTextWidth = Math.abs(this.settings.text_max_width) > 1 ? this.canvas.width : this.canvas.width * Math.abs(this.settings.text_max_width);
            }
            if (this.animationID) {
                cancelAnimationFrame(this.animationID);
                this.animationID = undefined;
            }
            this.wrapText(this.text);
        }
        if (innerWidth > this.originalWidth) {
            if (this.canvas.width != this.originalWidth) {
                this.canvas.width = this.originalWidth;
                reset(this.originalWidth);
            }
            return;
        }
        if (innerWidth < this.canvas.width) {
            this.canvas.width = innerWidth;
            reset(innerWidth);
        }
        else if (innerWidth > this.canvas.width) {
            this.canvas.width = innerWidth;
            reset(innerWidth);
        }
    }

    set(settings: EffectSettings, text?: string, ){
        // Unfortunately, this function needs to check that the values given "respect" some boundaries 
        // If you respect the types and don't try to break the Effect by passing size: 0 or -1 the use this:
        // if(settings.particles){
        //     this.settings.particles = {...this.settings.particles, ...settings.particles}
        //     delete settings.particles;
        // }
        // this.settings = { ...this.settings, ...settings };
        if(typeof settings.color === 'string') this.settings.color = settings.color;
        if(typeof settings.font_family === 'string') this.settings.font_family = settings.font_family;
        if(typeof settings.font_size === 'number') this.settings.font_size = Math.ceil(Math.abs(settings.font_size));
        if(typeof settings.letter_spacing === 'number') this.settings.letter_spacing = Math.ceil(Math.abs(settings.letter_spacing));
        if(typeof settings.stroke_color === 'string') this.settings.stroke_color = settings.stroke_color;
        if(typeof settings.stroke_width === 'number') this.settings.stroke_width = Math.ceil(Math.abs(settings.stroke_width));
        if(typeof settings.text_max_width === 'number') this.maxTextWidth = Math.abs(settings.text_max_width) > 1 ? this.maxTextWidth : this.canvas.width * settings.text_max_width;     
        if(typeof settings.word_spacing === 'number') this.settings.word_spacing = Math.ceil(Math.abs(settings.word_spacing));
        
        if(settings.particles && this.settings.particles){
            if(typeof settings.particles.size === 'number'){
                this.settings.particles.size = settings.particles.size > 0 ? Math.ceil(settings.particles.size) : 3;
                this.particleSize = this.settings.particles.size;
            } 
            if(typeof settings.particles.ease === 'number') this.settings.particles.ease = settings.particles.ease; 
            if(typeof settings.particles.friction === 'number') this.settings.particles.friction = settings.particles.friction;
            if(typeof settings.particles.radius === 'number') this.settings.particles.radius = settings.particles.radius;
            if(typeof settings.particles.trail_color === 'string'){
                if(settings.particles.trail_color != 'none'){
                    this.settings.particles.trail_color = settings.particles.trail_color;
                }
                else {
                    this.settings.particles.trail_color = undefined;
                }
            }
        }
        if(typeof text === 'string') this.text = text;

        const redraw = () => {
            if(this.animationID) {
                cancelAnimationFrame(this.animationID);
                this.animationID = undefined;
            }
            this.wrapText(this.text);
        }
        redraw();
    }
}

export { Effect }