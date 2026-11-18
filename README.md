# Biblioteca Popular Sur – Préstamos online

App web para que los socios de una biblioteca popular (cliente ficticio) busquen libros, los reserven y gestionen sus préstamos.

- HTML, CSS y JavaScript puro. Sin backend: datos simulados en `data.js` y estado guardado en `localStorage`.
- Login simulado – usuario de prueba: `sofia@bibliotecasur.org` / `sur2026` (también `martin@bibliotecasur.org` / `libros123`).

## Páginas
- **Landing** (`index.html`): presenta la app, el problema que resuelve, cómo funciona, una vista previa del catálogo y preguntas frecuentes.
- **App** (`app.html`): login, catálogo y "Mis préstamos".

## Funcionalidades
- Iniciar y cerrar sesión (simulado).
- Buscar por título o autor (sin importar tildes), filtrar por género y por disponibilidad.
- Ver la ficha de cada libro con libros del mismo género.
- Reservar libros (máximo 3 a la vez, 14 días).
- Ver "Mis préstamos" con días restantes, barra de progreso y alertas de vencimiento.
- Renovar una vez (+7 días) y devolver.

## Archivos
| Archivo | Qué hace |
| --- | --- |
| `index.html`, `landing.css`, `landing.js` | Landing. Lee los mismos datos que la app. |
| `app.html`, `app.js` | Login, catálogo, ficha del libro y préstamos. |
| `styles.css` | Colores, tipografías y estilos compartidos. |
| `data.js` | Mock data: usuarios, 14 libros (con los colores de cada tapa) y reglas. |
| `tapas.js` | Dibuja las tapas con CSS (las usan la landing y la app). |
| `netlify.toml` | Publica la carpeta tal cual, sin build. |

## Ver localmente
Abrí `index.html` en el navegador, o levantá un servidor en la carpeta:

```bash
python -m http.server 5173
```
