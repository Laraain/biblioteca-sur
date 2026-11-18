// Tapas dibujadas con CSS. Las usan la landing (index.html) y la app (app.html).
// Los colores salen siempre de LIBROS_INICIALES (data.js), aunque el estado guardado sea viejo.
function portadaHTML(libro, extraClase = "") {
  const original = LIBROS_INICIALES.find((l) => l.id === libro.id);
  const [fondo, tinta, adorno] = original.portada;
  return `
    <div class="portada portada--${adorno} ${extraClase}" style="--fondo:${fondo};--tinta:${tinta}">
      <span class="portada-titulo">${libro.titulo}</span>
      <span class="portada-autor">${libro.autor}</span>
    </div>`;
}
