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
const filtroGenero = $("filtro-genero");
const soloDisponibles = $("solo-disponibles");
const listaLibros = $("lista-libros");
const listaPrestamos = $("lista-prestamos");

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

// ---------- Dibujar en pantalla ----------
function cargarGeneros() {
  const generos = [...new Set(LIBROS_INICIALES.map((l) => l.genero))].sort();
  for (const g of generos) {
    const opcion = document.createElement("option");
    opcion.value = g;
    opcion.textContent = g;
    filtroGenero.appendChild(opcion);
  }
}

function normalizar(texto) {
  // Permite buscar "sabato" y encontrar "Sabato" o "Sábato".
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function librosFiltrados() {
  const texto = normalizar(buscador.value.trim());
  const genero = filtroGenero.value;
  return libros.filter((l) => {
    const coincideTexto = !texto || normalizar(l.titulo + " " + l.autor).includes(texto);
    const coincideGenero = genero === "todos" || l.genero === genero;
    const coincideDisponible = !soloDisponibles.checked || !l.prestadoA;
    return coincideTexto && coincideGenero && coincideDisponible;
  });
}

function renderCatalogo() {
  const resultado = librosFiltrados();
  const total = resultado.length;
  $("contador-resultados").textContent =
    total === 1 ? "1 libro encontrado" : `${total} libros encontrados`;

  listaLibros.innerHTML = "";

  if (total === 0) {
    listaLibros.innerHTML = `<li class="vacio">No encontramos libros con esos filtros.</li>`;
    return;
  }

  for (const libro of resultado) {
    const item = document.createElement("li");
    item.className = "libro";

    let estado, boton;
    if (!libro.prestadoA) {
      estado = `<span class="estado disponible">Disponible</span>`;
      boton = `<button class="btn btn-primario" data-accion="reservar" data-id="${libro.id}">Reservar</button>`;
    } else if (libro.prestadoA === usuarioActual.id) {
      estado = `<span class="estado mio">Lo tenés vos</span>`;
      boton = `<button class="btn btn-secundario" data-accion="devolver" data-id="${libro.id}">Devolver</button>`;
    } else {
      estado = `<span class="estado prestado">Prestado</span>`;
      boton = `<span class="vuelve">Vuelve el ${formatearFecha(libro.devolucion)}</span>`;
    }

    item.innerHTML = `
      <div class="libro-info">
        <h3>${libro.titulo}</h3>
        <p>${libro.autor} · ${libro.anio}</p>
        <span class="genero">${libro.genero}</span>
      </div>
      <div class="libro-acciones">${estado}${boton}</div>
    `;
    listaLibros.appendChild(item);
  }
}

function renderPrestamos() {
  const mios = misPrestamos().sort((a, b) => a.devolucion.localeCompare(b.devolucion));
  $("cupo").textContent = `${mios.length}/${REGLAS.maxPrestamos}`;
  listaPrestamos.innerHTML = "";

  if (mios.length === 0) {
    listaPrestamos.innerHTML = `<li class="vacio">Todavía no tenés libros. Elegí uno del catálogo.</li>`;
    return;
  }

  for (const libro of mios) {
    const dias = diasRestantes(libro.devolucion);
    let aviso = dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`;
    let clase = "";
    if (dias < 0) { aviso = dias === -1 ? "Vencido hace 1 día" : `Vencido hace ${-dias} días`; clase = "vencido"; }
    else if (dias <= 3) { aviso = dias === 0 ? "Vence hoy" : aviso; clase = "pronto"; }

    const yaRenovado = renovados.includes(libro.id);
    const item = document.createElement("li");
    item.className = `prestamo ${clase}`;
    item.innerHTML = `
      <h3>${libro.titulo}</h3>
      <p>Devolver el <strong>${formatearFecha(libro.devolucion)}</strong> · <span class="dias">${aviso}</span></p>
      <div class="prestamo-acciones">
        <button class="btn btn-secundario" data-accion="renovar" data-id="${libro.id}" ${yaRenovado ? "disabled" : ""}>
          ${yaRenovado ? "Ya renovado" : "Renovar +7 días"}
        </button>
        <button class="btn btn-primario" data-accion="devolver" data-id="${libro.id}">Devolver</button>
      </div>
    `;
    listaPrestamos.appendChild(item);
  }
}

function render() {
  renderCatalogo();
  renderPrestamos();
}

function mostrarPantalla() {
  const logueado = Boolean(usuarioActual);
  pantallaLogin.hidden = logueado;
  pantallaApp.hidden = !logueado;
  if (logueado) {
    $("nombre-usuario").textContent = usuarioActual.nombre;
    render();
  } else {
    $("email").focus();
  }
}

// Un solo "escuchador" para todos los botones de las listas (delegación de eventos).
function manejarClick(e) {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const acciones = { reservar, devolver, renovar };
  acciones[boton.dataset.accion](id);
}
listaLibros.addEventListener("click", manejarClick);
listaPrestamos.addEventListener("click", manejarClick);

buscador.addEventListener("input", renderCatalogo);
filtroGenero.addEventListener("change", renderCatalogo);
soloDisponibles.addEventListener("change", renderCatalogo);

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
cargarGeneros();
const sesionGuardada = leer(CLAVE_SESION, null);
usuarioActual = USUARIOS.find((u) => u.id === sesionGuardada) || null;
mostrarPantalla();
