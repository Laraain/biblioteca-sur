// Datos simulados (mock data). No hay backend: todo vive en el navegador.

// Socios habilitados para el login simulado.
const USUARIOS = [
  { id: "u1", nombre: "Sofía", email: "sofia@bibliotecasur.org", password: "sur2026" },
  { id: "u2", nombre: "Martín", email: "martin@bibliotecasur.org", password: "libros123" },
];

// Catálogo inicial. "prestadoA" indica qué socio lo tiene (null = disponible).
// "otro" representa a un socio que no usa la app, para que haya libros ya prestados.
const LIBROS_INICIALES = [
  { id: 1, titulo: "Rayuela", autor: "Julio Cortázar", genero: "Novela", anio: 1963, prestadoA: null },
  { id: 2, titulo: "Ficciones", autor: "Jorge Luis Borges", genero: "Cuento", anio: 1944, prestadoA: "otro", devolucion: "2026-11-25" },
  { id: 3, titulo: "El túnel", autor: "Ernesto Sabato", genero: "Novela", anio: 1948, prestadoA: null },
  { id: 4, titulo: "Las aventuras de la China Iron", autor: "Gabriela Cabezón Cámara", genero: "Novela", anio: 2017, prestadoA: null },
  { id: 5, titulo: "Nuestra parte de noche", autor: "Mariana Enriquez", genero: "Terror", anio: 2019, prestadoA: "otro", devolucion: "2026-11-30" },
  { id: 6, titulo: "Los peligros de fumar en la cama", autor: "Mariana Enriquez", genero: "Terror", anio: 2009, prestadoA: null },
  { id: 7, titulo: "Cuentos de la selva", autor: "Horacio Quiroga", genero: "Infantil", anio: 1918, prestadoA: null },
  { id: 8, titulo: "Martín Fierro", autor: "José Hernández", genero: "Poesía", anio: 1872, prestadoA: null },
  { id: 9, titulo: "Veinte poemas de amor", autor: "Pablo Neruda", genero: "Poesía", anio: 1924, prestadoA: "otro", devolucion: "2026-11-21" },
  { id: 10, titulo: "Breve historia de la Argentina", autor: "José Luis Romero", genero: "Historia", anio: 1965, prestadoA: null },
  { id: 11, titulo: "Operación Masacre", autor: "Rodolfo Walsh", genero: "Historia", anio: 1957, prestadoA: null },
  { id: 12, titulo: "El Principito", autor: "Antoine de Saint-Exupéry", genero: "Infantil", anio: 1943, prestadoA: null },
  { id: 13, titulo: "Distancia de rescate", autor: "Samanta Schweblin", genero: "Terror", anio: 2014, prestadoA: null },
  { id: 14, titulo: "El Aleph", autor: "Jorge Luis Borges", genero: "Cuento", anio: 1949, prestadoA: null },
];

// Reglas de la biblioteca.
const REGLAS = {
  maxPrestamos: 3,       // un socio puede tener hasta 3 libros a la vez
  diasPrestamo: 14,      // cada préstamo dura 14 días
  diasRenovacion: 7,     // se puede renovar una sola vez por 7 días más
};
