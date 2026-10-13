import * as THREE from 'three';
import { CONFIG } from './config.js';
import { isMobile } from './utils.js';

export function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(
            (window.WebGL2RenderingContext && canvas.getContext('webgl2')) ||
            (window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
        );
    } catch (e) {
        return false;
    }
}

/**
 * Crea renderer, cámara ortográfica, luces y la jerarquía de grupos.
 *
 * Jerarquía (una responsabilidad por grupo):
 *   intro  -> pop-in inicial (escala)
 *   scroll -> posición / rotación Y / escala según la sección
 *   tilt   -> parallax del puntero (rotación X/Z)
 *   spin   -> botón "Girar vista" (rotación Y)
 *   ...la habitación se añade dentro de spin.
 */
export function createStage(container) {
    const { camera: camCfg, renderer: rCfg, shadows: sCfg, lights: lCfg } = CONFIG;

    const scene = new THREE.Scene();
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
        aspect: window.innerWidth / window.innerHeight
    };

    // --- Cámara ortográfica ---------------------------------------------------
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 100);
    function updateCamera() {
        const frustum = Math.max(camCfg.minFrustum, camCfg.minVisibleWidth / sizes.aspect);
        camera.left = (-sizes.aspect * frustum) / 2;
        camera.right = (sizes.aspect * frustum) / 2;
        camera.top = frustum / 2;
        camera.bottom = -frustum / 2;
        camera.updateProjectionMatrix();
    }
    updateCamera();
    camera.position.set(...camCfg.position);
    camera.lookAt(...camCfg.lookAt);

    // --- Renderer -------------------------------------------------------------
    const pixelRatio = () =>
        Math.min(window.devicePixelRatio, isMobile() ? rCfg.maxPixelRatio.mobile : rCfg.maxPixelRatio.desktop);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(pixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = rCfg.exposure;
    container.appendChild(renderer.domElement);

    // --- Luces (los valores reales los aplica theme.js) -----------------------
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e4, 1);
    sun.position.set(...lCfg.sunPosition);
    sun.castShadow = true;
    sun.shadow.mapSize.set(sCfg.mapSize, sCfg.mapSize);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = sCfg.far;
    sun.shadow.camera.left = -sCfg.extent;
    sun.shadow.camera.right = sCfg.extent;
    sun.shadow.camera.top = sCfg.extent;
    sun.shadow.camera.bottom = -sCfg.extent;
    sun.shadow.normalBias = sCfg.normalBias;
    scene.add(sun);

    // Luces puntuales de la habitación: sin sombras (cada una costaría 6 pasadas por frame).
    // room.js las coloca en los empties del .glb o en la posición de respaldo.
    const deskLight = new THREE.PointLight(0xff9f1c, 0.6, lCfg.deskDistance, 2);
    const monitorLight = new THREE.PointLight(0x38bdf8, 0.4, lCfg.monitorDistance, 2);

    // --- Grupos ---------------------------------------------------------------
    const groups = {
        intro: new THREE.Group(),
        scroll: new THREE.Group(),
        tilt: new THREE.Group(),
        spin: new THREE.Group()
    };
    scene.add(groups.intro);
    groups.intro.add(groups.scroll);
    groups.scroll.add(groups.tilt);
    groups.tilt.add(groups.spin);

    // --- Bucle de render ------------------------------------------------------
    const clock = new THREE.Clock();
    let frameCallback = null;
    let active = false;

    const tick = () => {
        if (frameCallback) frameCallback(clock.getElapsedTime());
        renderer.render(scene, camera);
    };

    const runLoop = () => renderer.setAnimationLoop(tick);
    const pauseLoop = () => renderer.setAnimationLoop(null);

    // Pausa cuando la pestaña no está visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pauseLoop();
        else if (active) runLoop();
    });

    // Pérdida / recuperación del contexto WebGL
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        pauseLoop();
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
        if (active && !document.hidden) runLoop();
    });

    window.addEventListener('resize', () => {
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;
        sizes.aspect = sizes.width / sizes.height;
        updateCamera();
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(pixelRatio());
    });

    return {
        renderer,
        scene,
        camera,
        groups,
        lights: { ambient, sun, deskLight, monitorLight },
        onFrame(callback) { frameCallback = callback; },
        start() {
            active = true;
            if (!document.hidden) runLoop();
        }
    };
}
