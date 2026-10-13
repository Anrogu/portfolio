# Portafolio 3D isométrico

Proyecto modular con Three.js (r160, módulos ES), GSAP y Tailwind.

## Estructura

```
index.html            Página, meta/OG, importmap, loader
tailwind.config.js    Colores y fuentes (CDN)
models/room.glb       <- aquí va tu habitación
src/
  config.js           TODOS los valores ajustables (cámara, luces, temas, scroll, glb, contacto)
  content.js          Proyectos del portafolio
  main.js             Arranque, fallback sin WebGL, loader
  scene.js            Renderer, cámara, luces, grupos, bucle de render
  room.js             Carga del .glb, hooks por nombre, habitación procedural
  motion.js           Parallax del puntero y balanceo de objetos
  scroll.js           Animaciones por sección (GSAP ScrollTrigger)
  theme.js            Día/noche (preferencia del sistema + localStorage)
  ui.js               Proyectos, formulario, controles ligados a la escena
  styles.css          Estilos propios
```

## Ejecutar en local

Los módulos ES y el `.glb` **no funcionan abriendo el archivo con `file://`**. Usa un servidor:

```bash
cd portafolio-3d
npx serve .
# o: python3 -m http.server 8080
```

## Poner tu habitación

1. Exporta desde Blender a `models/room.glb` (ver abajo).
2. Abre la página. En la consola (F12) verás un resumen: pantallas, lámpara, monitores, silla y
   materiales horneados detectados. Si algo sale en `false` o `0`, revisa los nombres.
3. Ajusta `CONFIG.glb` en `src/config.js`.

### Exportar desde Blender

- Selecciona todo y aplica transformaciones: `Ctrl + A → All Transforms`.
- `File → Export → glTF 2.0 (.glb)`, formato **glTF Binary (.glb)**, activa **+Y Up** (por defecto).
- Con muchos polígonos, activa **Compression (Draco)**; el decoder ya está configurado.
- Si usas texturas horneadas: exporta la textura en JPG/PNG de tamaño razonable (2048 o 4096) y
  pon `baked: true` en `CONFIG.glb`.

### Convención de nombres de objetos

Todo es opcional. Lo que no exista simplemente no se anima.

| Nombre en Blender | Tipo | Qué hace |
|---|---|---|
| `screen*` (p. ej. `screen_left`) | malla | Recibe el color de pantalla que cambia el botón "Cambiar pantalla" |
| `window_glass*` | malla | Cambia de color entre día y noche |
| `lamp_shade*` | malla | Se ilumina de noche (emisión) |
| `lamp_light` | **Empty** | Posición de la luz cálida de la lámpara |
| `monitor_light` | **Empty** | Posición de la luz azul de los monitores |
| `chair` | Empty (padre) u objeto | Se balancea y salta al cambiar la pantalla |
| `plant` | Empty (padre) u objeto | Se balancea suavemente |

Notas:

- Three.js cambia espacios por `_` y elimina los puntos: `screen.001` llega como `screen001`
  (sigue coincidiendo, porque solo se compara el inicio del nombre).
- Para `chair` y `plant`, agrupa las partes bajo un **Empty** con ese nombre y coloca su origen en la
  base del objeto; si no, girará alrededor del origen del mundo.
- Si no pones `lamp_light` / `monitor_light`, se usan las posiciones de respaldo de
  `CONFIG.lights` (ajústalas a tu modelo).
- Si no hay mallas `screen*`, el botón "Cambiar pantalla" se oculta solo.

### Modelo normal (PBR) o texturas horneadas

- `baked: false` (por defecto): se respetan los materiales del `.glb`, con luces y sombras en
  tiempo real. El modo noche cambia las luces.
- `baked: true`: los materiales pasan a `MeshBasicMaterial` (la textura ya trae la luz), se
  desactivan las sombras y el tone mapping, y el modo noche **oscurece con un tinte**
  (`themes.night.bakedTint`). Si quieres un horneado distinto para la noche (dos texturas), el
  siguiente paso natural es intercambiar el `map` al cambiar de tema en `theme.js`.

### Ajuste automático (`fit`)

Con `fit: true`, el modelo se centra en X/Z, se apoya en `y = 0` y se escala para que su lado más largo
mida `targetSize` (6.4 unidades). Así los estados de scroll de `CONFIG.scroll` funcionan sin tocar
nada. Usa `rotationY` para girarlo si tu habitación mira hacia otro lado, y mueve la cámara con
`CONFIG.camera` si necesitas otro encuadre.

## Luces: ojo con las unidades

Three.js ≥ r155 usa unidades físicas: las luces direccionales y ambientales necesitan ≈ π veces la
intensidad antigua, y las puntuales se miden en candelas. Los valores de `CONFIG.themes` ya están
calibrados para la habitación procedural; con tu modelo es normal que tengas que subir o bajar
`ambient`, `sun`, `deskLight` y `monitorLight` hasta que se vea bien de día y de noche.

## Contenido

- Textos fijos (hero, sobre mí, contacto): `index.html`, busca los comentarios `TODO`.
- Proyectos: `src/content.js`. Si pones `url`, la tarjeta es un enlace.
- Imagen para redes: descomenta y completa las etiquetas `og:image` / `og:url` en `index.html`.

## Formulario de contacto

El formulario hace `POST` (FormData, `Accept: application/json`) a `CONFIG.contact.endpoint`.
Funciona con Formspree o con tu propia API. Mientras el valor esté vacío, funciona en **modo demo**
y no envía nada. Incluye un campo honeypot (`_gotcha`); valida y limita en el servidor de todos modos.

## Accesibilidad y rendimiento (ya incluido)

- Respeta `prefers-reduced-motion` y `prefers-color-scheme`; recuerda la elección de tema.
- Pausa el render con la pestaña oculta; limita el pixel ratio en móvil.
- Sin WebGL (o si falla el contexto) la página sigue funcionando con un fondo estático.

## Antes de publicar

- Tailwind por CDN compila en el navegador: para producción usa Tailwind CLI o Vite
  (`tailwind.config.js` se convierte en un módulo normal).
- Comprime el `.glb` (Draco o `gltf-transform optimize`) y revisa su peso.
- Sirve el sitio con HTTPS y cabeceras de caché para `models/` y las texturas.
