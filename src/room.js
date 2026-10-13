import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CONFIG } from './config.js';

// ============================================================================
// MATERIALES COMPARTIDOS (los que el tema y los botones controlan)
// ============================================================================
export function createMaterials() {
    return {
        screenGlow: new THREE.MeshBasicMaterial({ color: CONFIG.screenPalette[0] }),
        windowGlass: new THREE.MeshBasicMaterial({ color: CONFIG.themes.day.windowGlass }),
        lampShade: new THREE.MeshStandardMaterial({
            color: 0xffd166,
            emissive: 0xffb703,
            emissiveIntensity: CONFIG.themes.day.lampEmissive,
            roughness: 0.4
        })
    };
}

// "Hooks": todo lo que el resto de la app necesita saber de la habitación,
// sea procedural o un .glb.
function emptyHooks() {
    return {
        baked: false,
        sway: [],            // [{ object, baseY, amp, speed }]
        bounce: null,        // objeto que salta al cambiar la pantalla (silla)
        lampAnchor: null,    // Object3D donde va la luz de la lámpara
        monitorAnchor: null, // Object3D donde va la luz de los monitores
        screenCount: 0,
        tintMaterials: [],   // materiales horneados que se oscurecen de noche
        names: []            // nombres encontrados (depuración)
    };
}

// ============================================================================
// HABITACIÓN PROCEDURAL (respaldo si no hay .glb)
// ============================================================================
function setupMesh(mesh, cast = true, receive = true) {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    return mesh;
}

export function createProceduralRoom(mats) {
    const room = new THREE.Group();
    const hooks = emptyHooks();

    const std = (color, roughness = 0.6, extra = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    const m = {
        wall: std(0xfbf7f0, 0.85),
        floor: std(0xd4a373, 0.65),
        woodDark: std(0x6c584c, 0.5),
        woodLight: std(0xa98467, 0.5),
        metalDark: std(0x2b2d42, 0.3, { metalness: 0.5 }),
        rug: std(0xe07a5f, 0.9),
        rugInner: std(0xf4f1de, 0.9),
        plantLeaf: std(0x52b788, 0.6),
        pot: std(0xffffff, 0.4),
        chair: std(0x3d405b, 0.6)
    };

    // Piso y paredes en 'L'
    const floor = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(6, 0.35, 6), m.floor));
    floor.position.set(0, -0.175, 0);
    room.add(floor);

    const leftWall = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.4, 6), m.wall));
    leftWall.position.set(-2.825, 2.2, 0);
    room.add(leftWall);

    const backWall = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(5.65, 4.4, 0.35), m.wall));
    backWall.position.set(0.175, 2.2, -2.825);
    room.add(backWall);

    // Ventana
    const windowFrame = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 1.9), m.woodDark));
    windowFrame.position.set(-2.62, 2.55, 0.5);
    room.add(windowFrame);

    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 1.65), mats.windowGlass);
    windowGlass.position.set(-2.61, 2.55, 0.5);
    room.add(windowGlass);

    // Alfombra
    const rugMain = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 2.6), m.rug), false, true);
    rugMain.position.set(0.5, 0.02, 0.6);
    room.add(rugMain);

    const rugStripe = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 2.0), m.rugInner), false, true);
    rugStripe.position.set(0.5, 0.025, 0.6);
    room.add(rugStripe);

    // Escritorio y setup
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.2, 0, -1.85);
    room.add(deskGroup);

    const deskTop = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.3), m.woodLight));
    deskTop.position.set(0, 1.35, 0);
    deskGroup.add(deskTop);

    const leftLeg = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 1.15), m.metalDark));
    leftLeg.position.set(-1.45, 0.675, 0);
    deskGroup.add(leftLeg);

    const drawerUnit = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 1.18), m.woodDark));
    drawerUnit.position.set(1.1, 0.65, 0);
    deskGroup.add(drawerUnit);

    function createMonitor(x, z, rotY) {
        const g = new THREE.Group();
        g.position.set(x, 1.42, z);
        g.rotation.y = rotY;

        const stand = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.1), m.metalDark));
        stand.position.set(0, 0.15, -0.1);
        g.add(stand);

        const frame = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 0.07), m.metalDark));
        frame.position.set(0, 0.5, 0);
        g.add(frame);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.97, 0.57), mats.screenGlow);
        screen.position.set(0, 0.5, 0.038);
        g.add(screen);
        hooks.screenCount += 1;
        return g;
    }
    deskGroup.add(createMonitor(-0.55, -0.2, 0.15));
    deskGroup.add(createMonitor(0.55, -0.2, -0.18));

    const pad = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.5), m.metalDark));
    pad.position.set(-0.05, 1.43, 0.28);
    deskGroup.add(pad);

    const keyboard = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.22), m.pot));
    keyboard.position.set(-0.18, 1.45, 0.28);
    deskGroup.add(keyboard);

    // Lámpara de escritorio
    const lampBase = setupMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 16), m.metalDark));
    lampBase.position.set(-1.25, 1.45, 0.1);
    deskGroup.add(lampBase);

    const lampStem = setupMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 12), m.metalDark));
    lampStem.position.set(-1.25, 1.75, 0.1);
    deskGroup.add(lampStem);

    const lampCone = setupMesh(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 16), mats.lampShade));
    lampCone.position.set(-1.12, 2.02, 0.18);
    lampCone.rotation.z = -0.45;
    deskGroup.add(lampCone);

    // Silla
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0.1, 0, -0.55);
    chairGroup.rotation.y = -0.35;
    room.add(chairGroup);

    const chairSeat = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.75), m.chair));
    chairSeat.position.set(0, 0.82, 0);
    chairGroup.add(chairSeat);

    const chairBack = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.12), m.chair));
    chairBack.position.set(0, 1.28, 0.32);
    chairGroup.add(chairBack);

    const chairPole = setupMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 12), m.metalDark));
    chairPole.position.set(0, 0.42, 0);
    chairGroup.add(chairPole);

    const chairBase = setupMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 6), m.metalDark));
    chairBase.position.set(0, 0.05, 0);
    chairGroup.add(chairBase);

    // Estantería
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-2.15, 0, -1.6);
    room.add(shelfGroup);

    const shelfBody = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.0, 1.5), m.woodDark));
    shelfBody.position.set(0, 1.5, 0);
    shelfGroup.add(shelfBody);

    [0xe07a5f, 0x81b29a, 0xf2cc8f, 0x3d405b].forEach((color, i) => {
        const book = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.14), std(color, 0.5)));
        book.position.set(0.25, 2.3, -0.4 + i * 0.22);
        shelfGroup.add(book);
    });

    // Planta
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-2.05, 0, 2.0);
    room.add(plantGroup);

    const pot = setupMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.7, 16), m.pot));
    pot.position.set(0, 0.35, 0);
    plantGroup.add(pot);

    [
        [0, 0.95, 0, 0.42],
        [0.22, 1.25, 0.15, 0.32],
        [-0.2, 1.18, -0.18, 0.35],
        [0.1, 1.5, -0.1, 0.28]
    ].forEach(([x, y, z, r]) => {
        const leaf = setupMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), m.plantLeaf));
        leaf.position.set(x, y, z);
        plantGroup.add(leaf);
    });

    // Cuadro
    const artFrame = setupMesh(new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.08), m.metalDark));
    artFrame.position.set(2.0, 2.8, -2.62);
    room.add(artFrame);

    const artCanvas = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), m.rug);
    artCanvas.position.set(2.0, 2.8, -2.57);
    room.add(artCanvas);

    // Hooks
    hooks.sway.push({ object: plantGroup, baseY: plantGroup.rotation.y, ...CONFIG.sway.plant });
    hooks.sway.push({ object: chairGroup, baseY: chairGroup.rotation.y, ...CONFIG.sway.chair });
    hooks.bounce = chairGroup;

    return { group: room, hooks };
}

// ============================================================================
// .GLB: PREPARACIÓN POR CONVENCIÓN DE NOMBRES
// ============================================================================
export function prepareGLB(root, { mats, cfg = CONFIG.glb, anisotropy = 4 }) {
    const hooks = emptyHooks();
    hooks.baked = cfg.baked;
    const bakedCache = new Map();
    let chairObj = null;
    let plantObj = null;

    function toBaked(material) {
        if (Array.isArray(material)) return material.map(toBaked);
        if (bakedCache.has(material)) return bakedCache.get(material);

        const baked = new THREE.MeshBasicMaterial({
            map: material.map || null,
            alphaMap: material.alphaMap || null,
            color: material.map ? new THREE.Color(0xffffff) : (material.color ? material.color.clone() : new THREE.Color(0xffffff)),
            side: material.side,
            transparent: material.transparent,
            opacity: material.opacity,
            vertexColors: material.vertexColors
        });
        baked.userData.baseColor = baked.color.clone();
        bakedCache.set(material, baked);
        hooks.tintMaterials.push(baked);
        return baked;
    }

    root.traverse((obj) => {
        const name = obj.name || '';
        if (name) hooks.names.push(name);

        // Anclas y objetos con comportamiento (el primero que coincide gana;
        // al recorrer padre antes que hijos, un empty "chair" cubre a todos sus hijos)
        if (!obj.isMesh) {
            if (!hooks.lampAnchor && cfg.names.lampLight.test(name)) hooks.lampAnchor = obj;
            if (!hooks.monitorAnchor && cfg.names.monitorLight.test(name)) hooks.monitorAnchor = obj;
        }
        if (!chairObj && cfg.names.chair.test(name)) chairObj = obj;
        if (!plantObj && cfg.names.plant.test(name)) plantObj = obj;

        if (!obj.isMesh) return;

        if (cfg.names.screen.test(name)) {
            obj.material = mats.screenGlow;
            hooks.screenCount += 1;
            return;
        }
        if (cfg.names.windowGlass.test(name)) {
            obj.material = mats.windowGlass;
            return;
        }
        if (cfg.names.lampShade.test(name)) {
            obj.material = mats.lampShade;
            return;
        }

        if (cfg.baked) {
            obj.material = toBaked(obj.material);
            obj.castShadow = false;
            obj.receiveShadow = false;
        } else {
            obj.castShadow = cfg.castShadows;
            obj.receiveShadow = cfg.castShadows;
        }

        // Texturas nítidas en ángulos oblicuos (cámara isométrica)
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        list.forEach((mat) => {
            ['map', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach((slot) => {
                if (mat[slot]) mat[slot].anisotropy = anisotropy;
            });
        });
    });

    if (plantObj) hooks.sway.push({ object: plantObj, baseY: plantObj.rotation.y, ...CONFIG.sway.plant });
    if (chairObj) {
        hooks.sway.push({ object: chairObj, baseY: chairObj.rotation.y, ...CONFIG.sway.chair });
        hooks.bounce = chairObj;
    }

    return hooks;
}

// Centra en X/Z, apoya el piso en y=0 y escala. Devuelve un grupo envoltorio.
export function fitModel(model, cfg = CONFIG.glb) {
    const wrapper = new THREE.Group();
    wrapper.add(model);
    model.rotation.y += cfg.rotationY;
    wrapper.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    const largest = Math.max(size.x, size.z) || 1;
    wrapper.scale.setScalar(cfg.targetSize / largest);
    wrapper.updateMatrixWorld(true);
    return wrapper;
}

function loadGLTF(cfg, onProgress) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(cfg.dracoPath);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    return new Promise((resolve, reject) => {
        loader.load(
            cfg.url,
            (gltf) => { draco.dispose(); resolve(gltf); },
            (event) => { if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total); },
            (error) => { draco.dispose(); reject(error); }
        );
    });
}

function attachLights(group, hooks, lights) {
    const { deskLight, monitorLight } = lights;
    const { deskFallbackPosition, monitorFallbackPosition } = CONFIG.lights;

    if (hooks.lampAnchor) {
        deskLight.position.set(0, 0, 0);
        hooks.lampAnchor.add(deskLight);
    } else {
        deskLight.position.set(...deskFallbackPosition);
        group.add(deskLight);
    }

    if (hooks.monitorAnchor) {
        monitorLight.position.set(0, 0, 0);
        hooks.monitorAnchor.add(monitorLight);
    } else {
        monitorLight.position.set(...monitorFallbackPosition);
        group.add(monitorLight);
    }
}

// ============================================================================
// API PÚBLICA
// ============================================================================
export async function loadRoom({ renderer, lights, onProgress }) {
    const mats = createMaterials();
    const cfg = CONFIG.glb;
    let result = null;

    if (cfg.enabled) {
        try {
            const gltf = await loadGLTF(cfg, onProgress);
            const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            const hooks = prepareGLB(gltf.scene, { mats, cfg, anisotropy });
            const group = cfg.fit ? fitModel(gltf.scene, cfg) : gltf.scene;
            result = { group, hooks, source: 'glb' };

            console.info('[room] .glb cargado:', cfg.url, {
                pantallas: hooks.screenCount,
                lampara: Boolean(hooks.lampAnchor),
                monitores: Boolean(hooks.monitorAnchor),
                silla: Boolean(hooks.bounce),
                animados: hooks.sway.length,
                materialesHorneados: hooks.tintMaterials.length
            });
        } catch (error) {
            console.warn(`[room] No se pudo cargar ${cfg.url}; se usa la habitación procedural.`, error);
        }
    }

    if (!result) {
        const procedural = createProceduralRoom(mats);
        result = { ...procedural, source: 'procedural' };
    }

    attachLights(result.group, result.hooks, lights);
    return { ...result, mats };
}
