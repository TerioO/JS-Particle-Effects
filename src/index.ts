import './styles/index.scss';
import { Effect } from './Page/ParticleImg/ParticleImg';

import Christmas_tree from '/Christmas-tree.png?url';

new Effect({
    parent: document.querySelector('.particle-img.effect1') as HTMLElement,
    canvas_width: 450,
    canvas_height: 620,
    img_src: Christmas_tree,
}, {
    particleSize: 4,
})

