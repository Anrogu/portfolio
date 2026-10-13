import * as THREE from 'three';
import { CONFIG } from './config.js';
import { PROJECTS } from './content.js';
import { dur, prefersReduced } from './utils.js';

// ============================================================================
// PÁGINA (funciona sin WebGL)
// ============================================================================
const CARD_CLASS =
    'project-card group block w-full text-left p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 ' +
    'hover:bg-accent/10 dark:hover:bg-accent/15 border border-transparent hover:border-accent/30 transition-all';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function renderProjects() {
    const list = document.getElementById('projects-list');
    if (!list) return;

    PROJECTS.forEach((p) => {
        const li = document.createElement('li');
        const card = p.url ? el('a', CARD_CLASS) : el('button', CARD_CLASS);
        if (p.url) {
            card.href = p.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        } else {
            card.type = 'button';
        }

        const head = el('span', 'flex items-center justify-between gap-3 mb-1.5');
        head.append(
            el('span', 'project-title font-bold text-base sm:text-lg transition-colors', p.title),
            el('span', 'text-xs font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 shrink-0', p.tags)
        );
        card.append(head, el('span', 'block text-xs sm:text-sm opacity-85', p.description));

        li.append(card);
        list.append(li);
    });
}

function setupForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-feedback');
    if (!form || !status) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const baseClass = 'min-h-[1.25rem] text-xs font-semibold text-center pt-1 ';
    let timer = null;

    function say(message, kind) {
        const tone = kind === 'error'
            ? 'text-red-700 dark:text-red-300'
            : kind === 'ok'
                ? 'text-emerald-700 dark:text-emerald-300'
                : '';
        status.className = baseClass + tone;
        status.textContent = message;
        clearTimeout(timer);
        if (message) timer = setTimeout(() => { status.textContent = ''; }, 8000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Honeypot: un bot rellena el campo oculto; fingimos éxito y no enviamos
        if (form.elements._gotcha && form.elements._gotcha.value) {
            form.reset();
            say('¡Mensaje enviado! Gracias por escribirme.', 'ok');
            return;
        }

        const endpoint = CONFIG.contact.endpoint;
        if (!endpoint) {
            console.warn('[contacto] CONFIG.contact.endpoint está vacío: el mensaje no se envió.');
            say('Modo demo: todavía no hay un destino configurado, así que el mensaje no se envió.', 'info');
            return;
        }

        submitBtn.disabled = true;
        say('Enviando…', 'info');

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(form)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            say('¡Mensaje enviado! Gracias por escribirme.', 'ok');
        } catch (error) {
            console.error('[contacto] Error al enviar:', error);
            say('No se pudo enviar el mensaje. Inténtalo de nuevo en unos minutos.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

export function setupPage() {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
    renderProjects();
    setupForm();
}

// ============================================================================
// CONTROLES LIGADOS A LA ESCENA 3D
// ============================================================================
export function disableStageControls() {
    document.querySelectorAll('[data-needs-webgl], [data-needs-screens]').forEach((node) => {
        node.hidden = true;
    });
}

export function setupStageControls({ stage, room }) {
    const gsap = window.gsap;
    const { lights } = stage;

    // Cambiar color de las pantallas (solo si el modelo tiene mallas "screen*")
    document.querySelectorAll('[data-needs-screens]').forEach((node) => {
        node.hidden = room.hooks.screenCount === 0;
    });

    let screenIdx = 0;
    const screenBtn = document.getElementById('btn-change-screen');
    if (screenBtn) {
        screenBtn.addEventListener('click', () => {
            screenIdx = (screenIdx + 1) % CONFIG.screenPalette.length;
            const next = new THREE.Color(CONFIG.screenPalette[screenIdx]);
            gsap.to(room.mats.screenGlow.color, { r: next.r, g: next.g, b: next.b, duration: dur(0.5), overwrite: 'auto' });
            gsap.to(lights.monitorLight.color, { r: next.r, g: next.g, b: next.b, duration: dur(0.5), overwrite: 'auto' });

            const bounce = room.hooks.bounce;
            if (bounce && !prefersReduced()) {
                const baseY = bounce.userData.baseY ?? (bounce.userData.baseY = bounce.position.y);
                gsap.fromTo(bounce.position, { y: baseY + 0.35 }, { y: baseY, duration: 0.6, ease: 'bounce.out', overwrite: true });
            }
        });
    }

    // Girar la vista 90° (solo spinGroup; el parallax vive en tiltGroup)
    let extraRotationY = 0;
    const rotateBtn = document.getElementById('btn-rotate-room');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            extraRotationY += Math.PI / 2;
            gsap.to(stage.groups.spin.rotation, {
                y: extraRotationY,
                duration: dur(1.1),
                ease: 'back.out(1.4)'
            });
        });
    }
}
