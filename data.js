// Datos simulados (mock data). No hay backend: todo vive en el navegador.

// Socios habilitados para el login simulado.
const USUARIOS = [
  { id: "u1", nombre: "Sofía", email: "sofia@bibliotecasur.org", password: "sur2026" },
  { id: "u2", nombre: "Martín", email: "martin@bibliotecasur.org", password: "libros123" },
];

// Catálogo inicial. "prestadoA" indica qué socio lo tiene (null = disponible).
// "otro" representa a un socio que no usa la app, para que haya libros ya prestados.
// "vuelveEnDias": cuántos días después de hoy vuelve (así la demo nunca muestra fechas pasadas).
// "portada": [color de fondo, color de la letra, adorno]. Las tapas se dibujan con CSS
// (no usamos las tapas reales porque tienen derechos de autor).
const LIBROS_INICIALES = [
  { id: 1, titulo: "Rayuela", autor: "Julio Cortázar", genero: "Novela", anio: 1963, prestadoA: null, portada: ["#2E4A62", "#F4D8A8", "circulo"] },
  { id: 2, titulo: "Ficciones", autor: "Jorge Luis Borges", genero: "Cuento", anio: 1944, prestadoA: "otro", vuelveEnDias: 8, portada: ["#6B2D2D", "#EBD9C1", "marco"] },
  { id: 3, titulo: "El túnel", autor: "Ernesto Sabato", genero: "Novela", anio: 1948, prestadoA: null, portada: ["#1F1F1F", "#E8C07D", "arco"] },
  { id: 4, titulo: "Las aventuras de la China Iron", autor: "Gabriela Cabezón Cámara", genero: "Novela", anio: 2017, prestadoA: null, portada: ["#D98E5F", "#2B1E16", "franjas"] },
  { id: 5, titulo: "Nuestra parte de noche", autor: "Mariana Enriquez", genero: "Terror", anio: 2019, prestadoA: "otro", vuelveEnDias: 13, portada: ["#20202E", "#D9575B", "circulo"] },
  { id: 6, titulo: "Los peligros de fumar en la cama", autor: "Mariana Enriquez", genero: "Terror", anio: 2009, prestadoA: null, portada: ["#8C3B2E", "#F1E3CF", "puntos"] },
  { id: 7, titulo: "Cuentos de la selva", autor: "Horacio Quiroga", genero: "Infantil", anio: 1918, prestadoA: null, portada: ["#3E6B48", "#F5E6B8", "arco"] },
  { id: 8, titulo: "Martín Fierro", autor: "José Hernández", genero: "Poesía", anio: 1872, prestadoA: null, portada: ["#C9A56A", "#2A2218", "marco"] },
  { id: 9, titulo: "Veinte poemas de amor", autor: "Pablo Neruda", genero: "Poesía", anio: 1924, prestadoA: "otro", vuelveEnDias: 4, portada: ["#B85C6E", "#FBEDE6", "franjas"] },
  { id: 10, titulo: "Breve historia de la Argentina", autor: "José Luis Romero", genero: "Historia", anio: 1965, prestadoA: null, portada: ["#5B6B7A", "#F0E6D6", "marco"] },
  { id: 11, titulo: "Operación Masacre", autor: "Rodolfo Walsh", genero: "Historia", anio: 1957, prestadoA: null, portada: ["#E4DCCB", "#9E2B25", "franjas"] },
  { id: 12, titulo: "El Principito", autor: "Antoine de Saint-Exupéry", genero: "Infantil", anio: 1943, prestadoA: null, portada: ["#2C4C7A", "#F6D86B", "puntos"] },
  { id: 13, titulo: "Distancia de rescate", autor: "Samanta Schweblin", genero: "Terror", anio: 2014, prestadoA: null, portada: ["#A7B5A0", "#1E2A22", "arco"] },
  { id: 14, titulo: "El Aleph", autor: "Jorge Luis Borges", genero: "Cuento", anio: 1949, prestadoA: null, portada: ["#3A2E4F", "#E9C46A", "circulo"] },
];

// Reglas de la biblioteca.
const REGLAS = {
  maxPrestamos: 3,       // un socio puede tener hasta 3 libros a la vez
  diasPrestamo: 14,      // cada préstamo dura 14 días
  diasRenovacion: 7,     // se puede renovar una sola vez por 7 días más
};
