import './ParticleImg.scss';
import '../../components/initHihglightJS';
import { Effect } from './ParticleImg';

import Snow from './img1.jpg';
import Bricks from './brick-wall.png';

new Effect({
    parent: document.querySelector(".particle-img.effect2") as HTMLElement,
    canvas_width: 400,
    canvas_height: 450,
    img_src: Snow,
})

let effect3 = new Image();
effect3.src = Snow;
effect3.onload = () => {
    new Effect({
        parent: document.querySelector(".particle-img.effect3") as HTMLElement,
        canvas_width: effect3.width,    // Same width as img
        canvas_height: effect3.height,  // Same height as img
        img_src: effect3.src,
    }, {
        particleSize: 8,
        ease: 0.1,
        friction: 0.3,
        radius: 6000
    })
}


let effect1_settings = {
    particleSize: 8,
    ease: 0.2,
    friction: 0.75,
    radius: 30000
}

let effect1 = new Effect({
    parent: document.querySelector(".particle-img.effect1") as HTMLElement,
    canvas_width: window.innerWidth,
    canvas_height: 900,
    img_src: Bricks
}, {
    particleSize: effect1_settings.particleSize,
    radius: effect1_settings.radius,
    ease: effect1_settings.ease,
    friction: effect1_settings.friction,
})

let particle_size_input = document.querySelector('.playground .particle-size input');
if(particle_size_input instanceof HTMLInputElement) {
    particle_size_input.value = effect1_settings.particleSize + '';
    particle_size_input.addEventListener('input', (e: Event) => {
        if(e.target instanceof HTMLInputElement){
            if(Number(e.target.value) >= 1){
                effect1.setGap(Number(e.target.value));
            }
        }
})
}

let friction_input = document.querySelector('.playground .friction input');
if(friction_input instanceof HTMLInputElement) {
    friction_input.value = effect1_settings.friction + '';
    friction_input.addEventListener('input', (e) => {
        if(e.target instanceof HTMLInputElement) {
            effect1.setFriction(Number(e.target.value))
        };
    })
}

let ease_input = document.querySelector('.playground .ease input');
if(ease_input instanceof HTMLInputElement) {
    ease_input.value = effect1_settings.ease + '';
    ease_input.addEventListener('input', (e) => {
        if(e.target instanceof HTMLInputElement) {
            effect1.setEase(Number(e.target.value))
        };
    })
}

let radius_input = document.querySelector('.playground .radius input');
if(radius_input instanceof HTMLInputElement) {
    radius_input.value = effect1_settings.radius + '';
    radius_input.addEventListener('input', (e) => {
        if(e.target instanceof HTMLInputElement) {
            effect1.setRadius(Number(e.target.value))
        };
    })
}