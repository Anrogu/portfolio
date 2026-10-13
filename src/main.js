import * as THREE from 'three';
import { CONFIG } from './config.js';
import { prefersReduced } from './utils.js';
import { createStage, isWebGLAvailable } from './scene.js';
import { loadRoom } from './room.js';
import { createMotion } from './motion.js';
import { setupScroll } from './scroll.js';
import { setupTheme } from './theme.js';
import { setupPage, setupStageControls, disableStageControls } from './ui.js';

const loaderEl = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');

function setProgress(ratio) {
    if (loaderBar) loaderBar.style.width = Math.round(Math.min(1, ratio) * 100) + '%';
}

function hideLoader() {
    window.__ready = true;
    if (!loaderEl) return;
    loaderEl.setAttribute('aria-busy', 'false');
    if (prefersReduced()) {
        loaderEl.remove();
        return;
    }
    loaderEl.classList.add('is-hidden');
    loaderEl.addEventListener('transitionend', () => loaderEl.remove(), { once: true });
    setTimeout(() => loaderEl.remove(), 1200); // red de seguridad
}

// El contenido sigue siendo usable sin la escena 3D
function showFallback(reason) {
    console.warn('[3D] Escena desactivada:', reason);
    document.documentElement.classList.add('no-webgl');
    const note = document.getElementById('webgl-fallback');
    if (note) note.hidden = false;
    disableStageControls();
    hideLoader();
}

async function boot() {
    // Páginas y tema funcionan sin WebGL
    const theme = setupTheme();
    setupPage();

    if (!window.gsap || !window.ScrollTrigger) {
        showFallback('GSAP no está disponible');
        return;
    }
    if (!isWebGLAvailable()) {
        showFallback('WebGL no está disponible en este navegador');
        return;
    }

    let stage;
    try {
        stage = createStage(document.getElementById('webgl-container'));
    } catch (error) {
        showFallback(error);
        return;
    }

    if (loaderText) loaderText.textContent = 'Cargando habitación…';
    const room = await loadRoom({
        renderer: stage.renderer,
        lights: stage.lights,
        onProgress: setProgress
    });
    setProgress(1);

    stage.groups.spin.add(room.group);

    // Texturas horneadas: sin tone mapping ni sombras en tiempo real
    stage.renderer.toneMapping = room.hooks.baked ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    stage.lights.sun.castShadow = !room.hooks.baked && CONFIG.glb.castShadows;

    theme.attachRig({
        ambient: stage.lights.ambient,
        sun: stage.lights.sun,
        deskLight: stage.lights.deskLight,
        monitorLight: stage.lights.monitorLight,
        mats: room.mats,
        tintMaterials: room.hooks.tintMaterials
    });

    setupScroll(stage);
    setupStageControls({ stage, room });
    stage.onFrame(createMotion(stage, room));
    stage.start();

    // Pop-in inicial: solo toca el grupo intro, nunca compite con el scroll
    const intro = stage.groups.intro;
    if (prefersReduced()) {
        intro.scale.set(1, 1, 1);
    } else {
        intro.scale.set(0.01, 0.01, 0.01);
        window.gsap.to(intro.scale, {
            x: 1, y: 1, z: 1,
            duration: CONFIG.intro.duration,
            ease: 'elastic.out(1, 0.75)',
            delay: CONFIG.intro.delay
        });
    }

    hideLoader();
}

boot().catch((error) => {
    console.error('[3D] Error inesperado al iniciar:', error);
    showFallback(error);
});
