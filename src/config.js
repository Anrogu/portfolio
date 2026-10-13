// ============================================================================
// CONFIGURACIÓN CENTRAL
// Todos los "valores mágicos" del proyecto viven aquí. Los módulos solo leen.
// ============================================================================

export const CONFIG = {
    // Debe coincidir con la clave del script inline del <head> en index.html
    storageKey: 'portfolio-theme',

    contact: {
        // URL que recibe el POST del formulario (p. ej. https://formspree.io/f/xxxx
        // o tu propia API). Vacío = modo demo: no se envía nada.
        endpoint: ''
    },

    camera: {
        position: [12, 10, 12],
        lookAt: [0, 1.2, 0],
        minFrustum: 10,         // alto visible mínimo (unidades de escena)
        minVisibleWidth: 9.5    // ancho visible mínimo: evita recortes en portrait
    },

    renderer: {
        maxPixelRatio: { desktop: 2, mobile: 1.5 },
        exposure: 1.1
    },

    shadows: {
        mapSize: 2048,
        extent: 11,        // la habitación se desplaza y escala con el scroll
        far: 60,
        normalBias: 0.03
    },

    lights: {
        sunPosition: [8, 15, 7],
        // Posiciones de respaldo (espacio de la habitación ya ajustada) cuando el .glb
        // no trae los empties "lamp_light" / "monitor_light"
        deskFallbackPosition: [-0.8, 1.85, -1.6],
        monitorFallbackPosition: [0.2, 1.9, -1.65],
        deskDistance: 7,
        monitorDistance: 4.5
    },

    // ------------------------------------------------------------------------
    // TU HABITACIÓN (.glb)
    // Si el archivo no existe o falla la carga, se usa la habitación procedural.
    // ------------------------------------------------------------------------
    glb: {
        enabled: true,
        url: './models/room.glb',
        dracoPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',

        // Centra el modelo en X/Z, apoya el piso en y=0 y lo escala para que su lado
        // más largo mida `targetSize` unidades. Así los estados de scroll sirven
        // sin importar la escala con la que exportaste desde Blender.
        fit: true,
        targetSize: 6.4,
        rotationY: 0,              // radianes; Math.PI / 2 gira 90°

        // true  = texturas horneadas (Bokoko style): materiales sin iluminación (MeshBasicMaterial).
        //         Se desactivan sombras en tiempo real y el modo noche oscurece con un tinte.
        // false = materiales PBR del .glb iluminados por las luces de la escena.
        baked: false,
        castShadows: true,         // solo aplica si baked = false

        // Convención de nombres de objetos en Blender (se comparan con expresiones regulares).
        // Three.js reemplaza espacios por "_" y elimina "." de los nombres al cargar.
        names: {
            screen: /^screen/i,            // mallas de pantalla -> color editable con el botón
            windowGlass: /^window_?glass/i,// vidrio de ventana -> cambia día/noche
            lampShade: /^lamp_?shade/i,    // pantalla de lámpara -> emisión de noche
            lampLight: /^lamp_light/i,     // EMPTY: aquí se coloca la luz cálida de la lámpara
            monitorLight: /^monitor_light/i,// EMPTY: aquí se coloca la luz de los monitores
            chair: /^chair/i,              // objeto (o empty padre) de la silla: balanceo y salto
            plant: /^plant/i               // objeto (o empty padre) de la planta: balanceo
        }
    },

    // Movimiento ambiental de objetos (solo si existen en la escena)
    sway: {
        plant: { amp: 0.05, speed: 1.2 },
        chair: { amp: 0.08, speed: 0.8 }
    },

    parallax: { strength: 0.08, lerp: 0.06 },

    intro: { duration: 1.5, delay: 0.15 },

    // ------------------------------------------------------------------------
    // TEMAS: dos objetos; theme.js interpola entre ellos.
    // Intensidades calibradas para three r160 (unidades físicas: ≈ π × el valor antiguo).
    // Si algo se ve muy claro u oscuro con tu modelo, ajusta aquí.
    // ------------------------------------------------------------------------
    themes: {
        day: {
            ambient: { color: '#ffffff', intensity: 2.45 },
            sun: { color: '#fff5e3', intensity: 3.6 },
            deskLight: { intensity: 0.6 },
            monitorLight: { intensity: 0.4 },
            lampEmissive: 0.15,
            windowGlass: '#caf0f8',
            bakedTint: '#ffffff'
        },
        night: {
            ambient: { color: '#2e2961', intensity: 1.41 },
            sun: { color: '#4752ad', intensity: 1.26 },
            deskLight: { intensity: 10 },
            monitorLight: { intensity: 4 },
            lampEmissive: 0.95,
            windowGlass: '#1c2452',
            bakedTint: '#6b70b8'
        }
    },

    screenPalette: ['#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#f59e0b'],

    // ------------------------------------------------------------------------
    // SCROLL: estado de la habitación en cada sección
    // x/y = posición, rot = rotación Y, s = escala
    // ------------------------------------------------------------------------
    scroll: {
        order: ['hero', 'about', 'projects', 'contact'],
        scrub: 1.2,
        states: {
            desktop: {
                hero:     { x: 0,    y: 0,    rot: 0,     s: 1 },
                about:    { x: 3.2,  y: -0.4, rot: -0.45, s: 1.32 },
                projects: { x: -3.3, y: -0.3, rot: 0.68,  s: 1.18 },
                contact:  { x: 2.2,  y: -0.2, rot: 0.1,   s: 1 }
            },
            mobile: {
                hero:     { x: 0, y: 0,    rot: 0,     s: 1 },
                about:    { x: 0, y: -0.8, rot: -0.45, s: 1.05 },
                projects: { x: 0, y: -0.3, rot: 0.68,  s: 1.0 },
                contact:  { x: 0, y: -0.2, rot: 0.1,   s: 1 }
            }
        }
    }
};
