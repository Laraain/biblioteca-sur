// ============================================================
// Landing – muestra datos reales del catálogo (los mismos que usa la app)
// ============================================================
(function () {
  const $ = (id) => document.getElementById(id);

  function leer(clave, valorPorDefecto) {
    try {
      const dato = localStorage.getItem(clave);
      return dato ? JSON.parse(dato) : valorPorDefecto;
    } catch {
      return valorPorDefecto;
    }
  }

  // Mismo estado que guarda la app: si alguien reservó, acá se ve.
  const libros = leer("bs_libros", LIBROS_INICIALES);
  const usuario = USUARIOS.find((u) => u.id === leer("bs_sesion", null)) || null;
  const disponibles = libros.filter((l) => !l.prestadoA).length;

  // ---------- Datos y reglas (salen de data.js, no están escritos a mano) ----------
  $("dato-libros").textContent = libros.length;
  $("dato-cupo").textContent = REGLAS.maxPrestamos;
  $("dato-dias").textContent = `${REGLAS.diasPrestamo} + ${REGLAS.diasRenovacion}`;
  $("dato-disponibles").textContent = disponibles;
  const reglas = { max: REGLAS.maxPrestamos, dias: REGLAS.diasPrestamo, renov: REGLAS.diasRenovacion };
  document.querySelectorAll("[data-regla]").forEach((el) => {
    el.textContent = reglas[el.dataset.regla];
  });

  // ---------- Hero: estante y tarjeta de ejemplo ----------
  const porId = (id) => LIBROS_INICIALES.find((l) => l.id === id);
  $("hero-estante").innerHTML = [1, 5, 14, 8, 3].map((id) => portadaHTML(porId(id))).join("");
  $("hero-mini").innerHTML = portadaHTML(porId(1), "portada-mini");

  const enDosDias = new Date();
  enDosDias.setDate(enDosDias.getDate() + 2);
  $("hero-fecha").textContent =
    `${String(enDosDias.getDate()).padStart(2, "0")}/${String(enDosDias.getMonth() + 1).padStart(2, "0")}`;

  // ---------- Vista previa del catálogo ----------
  // Primero los disponibles: es lo que la persona quiere ver.
  const ordenados = [...libros].sort((a, b) => Number(Boolean(a.prestadoA)) - Number(Boolean(b.prestadoA)));
  $("l-catalogo").innerHTML = ordenados
    .map((libro) => {
      let estado = { clase: "disponible", texto: "Disponible" };
      if (libro.prestadoA && usuario && libro.prestadoA === usuario.id) estado = { clase: "mio", texto: "Lo tenés vos" };
      else if (libro.prestadoA) estado = { clase: "prestado", texto: "Prestado" };
      return `
        <li class="libro">
          <a class="libro-tapa" href="app.html" aria-label="${libro.titulo}: ingresá para reservarlo">${portadaHTML(libro)}</a>
          <span class="estado ${estado.clase}">${estado.texto}</span>
          <h3 class="libro-titulo">${libro.titulo}</h3>
          <p class="libro-autor">${libro.autor}</p>
        </li>`;
    })
    .join("");

  // ---------- Si ya hay sesión, los botones llevan directo a la app ----------
  if (usuario) {
    document.querySelectorAll("[data-cta]").forEach((a) => { a.textContent = `Seguir como ${usuario.nombre}`; });
    document.querySelectorAll("[data-cta-corto]").forEach((a) => { a.textContent = "Mi biblioteca"; });
    document.querySelectorAll("[data-cta-catalogo]").forEach((a) => { a.textContent = "Ir al catálogo →"; });
  }

  // ---------- Sombra de la barra al bajar ----------
  const nav = $("l-nav");
  const actualizarNav = () => nav.classList.toggle("con-sombra", window.scrollY > 8);
  window.addEventListener("scroll", actualizarNav, { passive: true });
  actualizarNav();

  // ---------- Aparición suave de las tarjetas ----------
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reducirMovimiento) {
    document.documentElement.classList.add("js-revelar");
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      }
    }, { threshold: 0.15 });
    document.querySelectorAll(".revelar").forEach((el) => observador.observe(el));
  }
})();
