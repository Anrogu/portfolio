import { CONFIG } from './config.js';
import { prefersReduced } from './utils.js';

/**
 * Devuelve la función que se ejecuta en cada frame:
 *  - parallax del puntero sobre tiltGroup (ejes X/Z, independiente del giro del botón)
 *  - balanceo de los objetos detectados en la habitación (planta, silla)
 */
export function createMotion(stage, room) {
    const { strength, lerp } = CONFIG.parallax;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    window.addEventListener('pointermove', (e) => {
        pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const tilt = stage.groups.tilt;
    const sway = room.hooks.sway;

    return function frame(elapsed) {
        if (prefersReduced()) {
            tilt.rotation.x = 0;
            tilt.rotation.z = 0;
            sway.forEach((s) => { s.object.rotation.y = s.baseY; });
            return;
        }

        pointer.x += (pointer.targetX - pointer.x) * lerp;
        pointer.y += (pointer.targetY - pointer.y) * lerp;
        tilt.rotation.x = pointer.y * strength;
        tilt.rotation.z = -pointer.x * strength;

        sway.forEach((s) => {
            s.object.rotation.y = s.baseY + Math.sin(elapsed * s.speed) * s.amp;
        });
    };
}
