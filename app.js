// ============================================================
// Biblioteca Popular Sur – lógica de la app (todo en el frontend)
// ============================================================

// ---------- Estado y almacenamiento ----------
// Guardamos en localStorage para que los préstamos no se pierdan al recargar.
const CLAVE_LIBROS = "bs_libros";
const CLAVE_SESION = "bs_sesion";
const CLAVE_RENOVADOS = "bs_renovados";

function leer(clave, valorPorDefecto) {
  try {
    const dato = localStorage.getItem(clave);
    return dato ? JSON.parse(dato) : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el navegador bloquea el almacenamiento, la app sigue funcionando en memoria.
  }
}

let libros = leer(CLAVE_LIBROS, structuredClone(LIBROS_INICIALES));
let renovados = leer(CLAVE_RENOVADOS, []); // ids de libros que ya se renovaron
let usuarioActual = null;

// Filtros del catálogo
let generoActual = "todos";
let soloDisponibles = false;

// Los libros que tiene "otro" socio vuelven siempre unos días después de hoy,
// así el catálogo nunca muestra una fecha de devolución que ya pasó.
for (const libro of libros) {
  const original = LIBROS_INICIALES.find((l) => l.id === libro.id);
  if (libro.prestadoA === "otro" && original && original.vuelveEnDias) {
    libro.devolucion = sumarDias(hoyISO(), original.vuelveEnDias);
  }
}

// ---------- Utilidades de fechas ----------
// Fecha local en formato AAAA-MM-DD (sin usar UTC, para no "saltar" de día de noche).
function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(fechaISO, dias) {
  const fecha = new Date(fechaISO + "T12:00:00");
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

function hoyISO() {
  return aISO(new Date());
}

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

// "25 nov" para textos cortos
function fechaCorta(fechaISO) {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [, mes, dia] = fechaISO.split("-");
  return `${Number(dia)} ${meses[Number(mes) - 1]}`;
}

function diasRestantes(fechaISO) {
  const hoy = new Date(hoyISO() + "T12:00:00");
  const fin = new Date(fechaISO + "T12:00:00");
  return Math.round((fin - hoy) / 86400000);
}

// ---------- Elementos de la página ----------
const $ = (id) => document.getElementById(id);
const pantallaLogin = $("pantalla-login");
const pantallaApp = $("pantalla-app");
const formLogin = $("form-login");
const errorLogin = $("error-login");
const buscador = $("buscador");
const navGeneros = $("nav-generos");
const estantes = $("estantes");
const listaPrestamos = $("lista-prestamos");
const detalle = $("detalle");

// ---------- Login simulado ----------
function iniciarSesion(email, password) {
  const usuario = USUARIOS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!usuario) return false;
  usuarioActual = usuario;
  guardar(CLAVE_SESION, usuario.id);
  return true;
}

function cerrarSesion() {
  usuarioActual = null;
  try { localStorage.removeItem(CLAVE_SESION); } catch {}
  mostrarPantalla();
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("email").value;
  const password = $("password").value;

  if (!email || !password) {
    errorLogin.textContent = "Completá email y contraseña.";
    return;
  }
  if (!iniciarSesion(email, password)) {
    errorLogin.textContent = "Email o contraseña incorrectos.";
    $("password").value = "";
    return;
  }
  errorLogin.textContent = "";
  formLogin.reset();
  mostrarPantalla();
  avisar(`¡Bienvenida/o, ${usuarioActual.nombre}!`);
});

$("btn-demo").addEventListener("click", () => {
  $("email").value = "sofia@bibliotecasur.org";
  $("password").value = "sur2026";
  errorLogin.textContent = "";
});

$("btn-salir").addEventListener("click", cerrarSesion);

// ---------- Préstamos ----------
function misPrestamos() {
  return libros.filter((l) => l.prestadoA === usuarioActual.id);
}

function reservar(idLibro) {
  const libro = libros.find((l) => l.id === idLibro);
  if (!libro || libro.prestadoA) return;

  if (misPrestamos().length >= REGLAS.maxPrestamos) {
    avisar(`Ya tenés ${REGLAS.maxPrestamos} libros. Devolvé uno para pedir otro.`, true);
    return;
  }

  libro.prestadoA = usuarioActual.id;
  libro.devolucion = sumarDias(hoyISO(), REGLAS.diasPrestamo);
  persistir();
  avisar(`Reservaste "${libro.titulo}". Devolvelo antes del ${formatearFecha(libro.devolucion)}.`);
}

function devolver(idLibro) {
  const libro = libros.find((l) => l.id === idLibro);
  if (!libro || libro.prestadoA !== usuarioActual.id) return;

  libro.prestadoA = null;
  delete libro.devolucion;
  renovados = renovados.filter((id) => id !== idLibro);
  persistir();
  avisar(`Devolviste "${libro.titulo}". ¡Gracias!`);
}

function renovar(idLibro) {
  const libro = libros.find((l) => l.id === idLibro);
  if (!libro || libro.prestadoA !== usuarioActual.id) return;

  if (renovados.includes(idLibro)) {
    avisar("Este préstamo ya se renovó una vez.", true);
    return;
  }
  libro.devolucion = sumarDias(libro.devolucion, REGLAS.diasRenovacion);
  renovados.push(idLibro);
  persistir();
  avisar(`Renovado: nueva fecha ${formatearFecha(libro.devolucion)}.`);
}

function persistir() {
  guardar(CLAVE_LIBROS, libros);
  guardar(CLAVE_RENOVADOS, renovados);
  render();
}

// Estado de un libro visto por el usuario actual
function estadoDe(libro) {
  if (!libro.prestadoA) return { clase: "disponible", texto: "Disponible" };
  if (libro.prestadoA === usuarioActual.id) return { clase: "mio", texto: "Lo tenés vos" };
  return { clase: "prestado", texto: "Prestado" };
}

// ---------- Dibujar en pantalla ----------
function generos() {
  return [...new Set(LIBROS_INICIALES.map((l) => l.genero))].sort();
}

function renderGeneros() {
  const opciones = ["todos", ...generos()];
  navGeneros.innerHTML = opciones
    .map((g) => {
      const cantidad = g === "todos" ? libros.length : libros.filter((l) => l.genero === g).length;
      const nombre = g === "todos" ? "Todos" : g;
      const activo = g === generoActual;
      return `<button type="button" class="${activo ? "activo" : ""}" data-genero="${g}" aria-pressed="${activo}">
          <span>${nombre}</span><span class="nav-cantidad">${cantidad}</span>
        </button>`;
    })
    .join("");
}

function normalizar(texto) {
  // Permite buscar "sabato" y encontrar "Sabato" o "Sábato".
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function librosFiltrados() {
  const texto = normalizar(buscador.value.trim());
  return libros.filter((l) => {
    const coincideTexto = !texto || normalizar(l.titulo + " " + l.autor).includes(texto);
    const coincideGenero = generoActual === "todos" || l.genero === generoActual;
    const coincideDisponible = !soloDisponibles || !l.prestadoA;
    return coincideTexto && coincideGenero && coincideDisponible;
  });
}

function libroEnEstante(libro) {
  const estado = estadoDe(libro);
  let boton;
  if (estado.clase === "disponible") {
    boton = `<button class="btn btn-mini btn-primario" data-accion="reservar" data-id="${libro.id}">Reservar</button>`;
  } else if (estado.clase === "mio") {
    boton = `<button class="btn btn-mini btn-secundario" data-accion="devolver" data-id="${libro.id}">Devolver</button>`;
  } else {
    boton = `<span class="btn-mini nota">Vuelve el ${fechaCorta(libro.devolucion)}</span>`;
  }
  return `
    <li class="libro">
      <button class="libro-tapa" data-accion="ver" data-id="${libro.id}" aria-label="Ver ficha de ${libro.titulo}">
        ${portadaHTML(libro)}
      </button>
      <span class="estado ${estado.clase}">${estado.texto}</span>
      <h3 class="libro-titulo">${libro.titulo}</h3>
      <p class="libro-autor">${libro.autor}</p>
      ${boton}
    </li>`;
}

function renderCatalogo() {
  const resultado = librosFiltrados();
  const total = resultado.length;
  $("contador-resultados").textContent =
    total === 1 ? "1 libro encontrado" : `${total} libros encontrados`;

  if (total === 0) {
    estantes.innerHTML = `
      <div class="vacio">
        <p class="vacio-titulo">No encontramos libros con esos filtros.</p>
        <p>Probá con otro título, autor o género.</p>
      </div>`;
    return;
  }

  // Un estante por género, como en la biblioteca.
  estantes.innerHTML = generos()
    .map((g) => {
      const delGenero = resultado.filter((l) => l.genero === g);
      if (delGenero.length === 0) return "";
      const libres = delGenero.filter((l) => !l.prestadoA).length;
      return `
        <section class="estante">
          <div class="estante-cabecera">
            <h2>${g}</h2>
            <span>${libres} de ${delGenero.length} disponibles</span>
          </div>
          <ul class="estante-fila">${delGenero.map(libroEnEstante).join("")}</ul>
        </section>`;
    })
    .join("");
}

function renderPrestamos() {
  const mios = misPrestamos().sort((a, b) => a.devolucion.localeCompare(b.devolucion));

  // Cupo: tres puntitos, uno por libro
  $("cupo").innerHTML =
    Array.from({ length: REGLAS.maxPrestamos }, (_, i) =>
      `<span class="cupo-punto ${i < mios.length ? "lleno" : ""}"></span>`
    ).join("") + `<span class="cupo-texto">${mios.length}/${REGLAS.maxPrestamos}</span>`;
  $("tab-contador").textContent = mios.length || "";

  if (mios.length === 0) {
    listaPrestamos.innerHTML = `
      <li class="vacio vacio-prestamos">
        <p class="vacio-titulo">Todavía no tenés libros.</p>
        <p>Elegí uno del catálogo y aparece acá con su fecha de devolución.</p>
      </li>`;
    return;
  }

  listaPrestamos.innerHTML = mios
    .map((libro) => {
      const dias = diasRestantes(libro.devolucion);
      const yaRenovado = renovados.includes(libro.id);

      let aviso = dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`;
      let clase = "";
      if (dias < 0) { aviso = dias === -1 ? "Vencido hace 1 día" : `Vencido hace ${-dias} días`; clase = "vencido"; }
      else if (dias <= 3) { aviso = dias === 0 ? "Vence hoy" : aviso; clase = "pronto"; }

      // Barra de progreso: cuánto del préstamo ya pasó
      const duracion = REGLAS.diasPrestamo + (yaRenovado ? REGLAS.diasRenovacion : 0);
      const avance = Math.min(100, Math.max(0, ((duracion - dias) / duracion) * 100));

      return `
        <li class="prestamo ${clase}">
          ${portadaHTML(libro, "portada-mini")}
          <div class="prestamo-info">
            <h3>${libro.titulo}</h3>
            <p>Devolver el <strong>${formatearFecha(libro.devolucion)}</strong></p>
            <div class="progreso" aria-hidden="true"><span style="width:${avance}%"></span></div>
            <p class="dias">${aviso}</p>
          </div>
          <div class="prestamo-acciones">
              <button class="btn btn-mini btn-secundario" data-accion="renovar" data-id="${libro.id}" ${yaRenovado ? "disabled" : ""}>
                ${yaRenovado ? "Ya renovado" : "Renovar +7"}
              </button>
              <button class="btn btn-mini btn-primario" data-accion="devolver" data-id="${libro.id}">Devolver</button>
          </div>
        </li>`;
    })
    .join("");
}

// ---------- Ficha del libro ----------
let libroAbierto = null;

function verLibro(idLibro) {
  libroAbierto = idLibro;
  renderDetalle();
  if (!detalle.open) detalle.showModal();
}

function renderDetalle() {
  const libro = libros.find((l) => l.id === libroAbierto);
  if (!libro) return;
  const estado = estadoDe(libro);
  const original = LIBROS_INICIALES.find((l) => l.id === libro.id);

  let accion;
  if (estado.clase === "disponible") {
    accion = `<button class="btn btn-primario" data-accion="reservar" data-id="${libro.id}">Reservar por ${REGLAS.diasPrestamo} días</button>`;
  } else if (estado.clase === "mio") {
    accion = `<button class="btn btn-secundario" data-accion="devolver" data-id="${libro.id}">Devolver</button>
              <span class="detalle-nota">Lo devolvés el ${formatearFecha(libro.devolucion)}</span>`;
  } else {
    accion = `<button class="btn btn-primario" disabled>Prestado</button>
              <span class="detalle-nota">Vuelve el ${formatearFecha(libro.devolucion)}</span>`;
  }

  const parecidos = libros.filter((l) => l.genero === libro.genero && l.id !== libro.id);

  $("detalle-contenido").innerHTML = `
    <div class="detalle-hero" style="--fondo:${original.portada[0]}">
      <button class="btn-icono detalle-cerrar" data-accion="cerrar" aria-label="Cerrar">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      ${portadaHTML(libro, "portada-grande")}
      <div class="detalle-datos">
        <span class="estado ${estado.clase}">${estado.texto}</span>
        <h2 id="detalle-titulo">${libro.titulo}</h2>
        <p class="detalle-autor">${libro.autor}</p>
        <p class="detalle-meta">${libro.genero} · ${libro.anio}</p>
      </div>
    </div>
    <div class="detalle-cuerpo">
      <div class="detalle-acciones">${accion}</div>
      ${parecidos.length ? `
        <p class="detalle-subtitulo">Más de ${libro.genero}</p>
        <ul class="detalle-parecidos">
          ${parecidos.map((p) => `
            <li><button class="libro-tapa" data-accion="ver" data-id="${p.id}" aria-label="Ver ficha de ${p.titulo}">
              ${portadaHTML(p, "portada-chica")}
            </button><span>${p.titulo}</span></li>`).join("")}
        </ul>` : ""}
    </div>`;
}

function cerrarDetalle() {
  libroAbierto = null;
  detalle.close();
}

// Clic fuera de la ficha la cierra
detalle.addEventListener("click", (e) => {
  if (e.target === detalle) cerrarDetalle();
});
detalle.addEventListener("close", () => { libroAbierto = null; });

// ---------- Render general ----------
function render() {
  renderGeneros();
  renderCatalogo();
  renderPrestamos();
  if (libroAbierto !== null) renderDetalle();
}

function mostrarPantalla() {
  const logueado = Boolean(usuarioActual);
  pantallaLogin.hidden = logueado;
  pantallaApp.hidden = !logueado;
  if (logueado) {
    $("nombre-usuario").textContent = usuarioActual.nombre;
    $("avatar").textContent = usuarioActual.nombre.charAt(0);
    $("saludo").textContent = `Hola, ${usuarioActual.nombre}`;
    render();
  } else {
    if (detalle.open) cerrarDetalle();
    // En celular no enfocamos el email: abriría el teclado y taparía la pantalla.
    if (window.matchMedia("(pointer: fine)").matches) $("email").focus();
  }
}

// Un solo "escuchador" para todos los botones con data-accion (delegación de eventos).
function manejarClick(e) {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const acciones = { reservar, devolver, renovar, ver: verLibro, cerrar: cerrarDetalle };
  acciones[boton.dataset.accion](id);
}
estantes.addEventListener("click", manejarClick);
listaPrestamos.addEventListener("click", manejarClick);
detalle.addEventListener("click", manejarClick);

// Filtros
buscador.addEventListener("input", renderCatalogo);

navGeneros.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-genero]");
  if (!boton) return;
  generoActual = boton.dataset.genero;
  renderGeneros();
  renderCatalogo();
});

document.querySelectorAll("[data-disponibilidad]").forEach((boton) => {
  boton.addEventListener("click", () => {
    soloDisponibles = boton.dataset.disponibilidad === "disponibles";
    document.querySelectorAll("[data-disponibilidad]").forEach((b) => {
      b.classList.toggle("activo", b === boton);
      b.setAttribute("aria-pressed", b === boton);
    });
    renderCatalogo();
  });
});

// Pestañas del celular: Catálogo / Mis préstamos
document.querySelectorAll("[data-ir]").forEach((boton) => {
  boton.addEventListener("click", () => {
    pantallaApp.dataset.vista = boton.dataset.ir;
    document.querySelectorAll("[data-ir]").forEach((b) => b.classList.toggle("activo", b === boton));
    window.scrollTo(0, 0);
  });
});

// ---------- Aviso flotante ----------
let temporizador;
function avisar(mensaje, esError = false) {
  const toast = $("toast");
  toast.textContent = mensaje;
  toast.classList.toggle("toast-error", esError);
  toast.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// ---------- Inicio ----------
// Estante decorativo de la pantalla de login
$("login-estante").innerHTML = [1, 5, 12, 8, 3].map((id) =>
  portadaHTML(LIBROS_INICIALES.find((l) => l.id === id))
).join("");

const sesionGuardada = leer(CLAVE_SESION, null);
usuarioActual = USUARIOS.find((u) => u.id === sesionGuardada) || null;
mostrarPantalla();
