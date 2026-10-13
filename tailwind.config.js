// Configuración para el CDN de Tailwind (se carga después de cdn.tailwindcss.com).
// Si migras a Tailwind CLI / Vite, este mismo objeto va en tailwind.config.js (module.exports).
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace']
            },
            colors: {
                cream: '#f5efe6',
                night: '#121324',
                accent: '#e07a5f',        // decorativo (fondos suaves, bordes)
                accentStrong: '#b94f36'   // fondos con texto blanco (contraste >= 4.5:1)
            }
        }
    }
};
