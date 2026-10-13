import { CONFIG } from './config.js';
import { prefersReduced } from './utils.js';

export function setupScroll(stage) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const target = stage.groups.scroll;
    const { order, states, scrub } = CONFIG.scroll;

    // Barra de progreso superior
    gsap.to('#scroll-bar', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
            trigger: '.page-content',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.2
        }
    });

    function applyState(s) {
        target.position.set(s.x, s.y, 0);
        target.rotation.y = s.rot;
        target.scale.set(s.s, s.s, s.s);
    }

    // matchMedia recrea las animaciones cuando cambia el breakpoint (girar el teléfono, redimensionar)
    const mm = gsap.matchMedia();
    mm.add(
        { isDesktop: '(min-width: 768px)', isMobile: '(max-width: 767px)' },
        (ctx) => {
            const set = ctx.conditions.isDesktop ? states.desktop : states.mobile;
            applyState(set[order[0]]);

            order.slice(1).forEach((id, i) => {
                const from = set[order[i]];
                const to = set[id];

                // immediateRender:false evita que los "from" de timelines posteriores
                // pisen el estado inicial antes de llegar a su sección
                gsap.timeline({
                    defaults: { ease: 'none', immediateRender: false },
                    scrollTrigger: {
                        trigger: '#' + id,
                        start: 'top bottom',
                        end: 'center center',
                        scrub: prefersReduced() ? true : scrub
                    }
                })
                    .fromTo(target.position, { x: from.x, y: from.y }, { x: to.x, y: to.y }, 0)
                    .fromTo(target.rotation, { y: from.rot }, { y: to.rot }, 0)
                    .fromTo(target.scale,
                        { x: from.s, y: from.s, z: from.s },
                        { x: to.s, y: to.s, z: to.s }, 0);
            });
        }
    );
}
