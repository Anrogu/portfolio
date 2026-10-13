import * as THREE from 'three';
import { CONFIG } from './config.js';
import { dur } from './utils.js';

const KEY = CONFIG.storageKey;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function readStored() {
    try {
        const v = localStorage.getItem(KEY);
        return v === 'night' || v === 'day' ? v : null;
    } catch (e) {
        return null;
    }
}

function store(name) {
    try { localStorage.setItem(KEY, name); } catch (e) { /* modo privado */ }
}

/**
 * Tema día/noche.
 *  - Estado inicial: elección guardada > preferencia del sistema.
 *  - La parte DOM funciona sin WebGL ni GSAP.
 *  - La parte 3D se activa con attachRig() y tweenea entre CONFIG.themes.day / .night.
 */
export function setupTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const thumb = document.getElementById('theme-thumb');
    const label = document.getElementById('theme-label');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');

    const stored = readStored();
    let userChose = stored !== null;
    let current = stored || (systemDark.matches ? 'night' : 'day');
    let rig = null;
    const tint = new THREE.Color('#ffffff');

    // El recorrido del thumb se mide del propio botón (no un valor fijo)
    const thumbTravel = () => Math.max(0, btn.clientWidth - thumb.offsetWidth - 12);

    function applyDom(name) {
        const night = name === 'night';
        html.classList.toggle('dark', night);
        html.classList.toggle('light', !night);

        btn.setAttribute('aria-pressed', String(night));
        btn.setAttribute('aria-label', night ? 'Modo noche activado' : 'Modo noche');
        label.textContent = night ? 'Noche' : 'Día';
        label.style.right = night ? 'auto' : '0.75rem';
        label.style.left = night ? '0.75rem' : 'auto';
        iconSun.classList.toggle('hidden', night);
        iconMoon.classList.toggle('hidden', !night);
        thumb.style.setProperty('--thumb-x', (night ? thumbTravel() : 0) + 'px');
    }

    function tweenColor(color, hex, duration, onUpdate) {
        const c = new THREE.Color(hex);
        window.gsap.to(color, { r: c.r, g: c.g, b: c.b, duration, overwrite: 'auto', onUpdate });
    }

    function updateTint() {
        rig.tintMaterials.forEach((m) => m.color.copy(m.userData.baseColor).multiply(tint));
    }

    function applyRig(name, animate) {
        if (!rig || !window.gsap) return;
        const t = CONFIG.themes[name];
        const d = animate ? dur(1.2) : 0;
        const gsap = window.gsap;

        tweenColor(rig.ambient.color, t.ambient.color, d);
        gsap.to(rig.ambient, { intensity: t.ambient.intensity, duration: d, overwrite: 'auto' });

        tweenColor(rig.sun.color, t.sun.color, d);
        gsap.to(rig.sun, { intensity: t.sun.intensity, duration: d, overwrite: 'auto' });

        gsap.to(rig.deskLight, { intensity: t.deskLight.intensity, duration: d, overwrite: 'auto' });
        gsap.to(rig.monitorLight, { intensity: t.monitorLight.intensity, duration: d, overwrite: 'auto' });
        gsap.to(rig.mats.lampShade, { emissiveIntensity: t.lampEmissive, duration: d, overwrite: 'auto' });

        tweenColor(rig.mats.windowGlass.color, t.windowGlass, d);
        tweenColor(tint, t.bakedTint, d, updateTint);
        if (d === 0) updateTint();
    }

    function set(name, { animate = true, persist = false } = {}) {
        current = name;
        applyDom(name);
        applyRig(name, animate);
        if (persist) {
            userChose = true;
            store(name);
        }
    }

    btn.addEventListener('click', () => set(current === 'night' ? 'day' : 'night', { persist: true }));

    // Si el usuario nunca eligió, seguimos los cambios del sistema
    systemDark.addEventListener('change', (e) => {
        if (!userChose) set(e.matches ? 'night' : 'day');
    });

    window.addEventListener('resize', () => {
        thumb.style.setProperty('--thumb-x', (current === 'night' ? thumbTravel() : 0) + 'px');
    });

    applyDom(current);

    return {
        // Conecta las luces y materiales 3D; aplica el tema actual sin animación
        attachRig(newRig) {
            rig = newRig;
            applyRig(current, false);
        }
    };
}
