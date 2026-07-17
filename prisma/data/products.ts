// categoryId puede apuntar a cualquier nivel (departamento, categoria o subcategoria)
export const products = [
  {
    name: "Arroz Blanco 1 kg",
    price: 1.5,
    image: "arroz",
    stock: 25,
    categoryId: "sub-arroz-blanco"
  },
  {
    name: "Arroz Integral 1 kg",
    price: 1.8,
    image: "arroz",
    stock: 12,
    categoryId: "sub-arroz-integral"
  },
  {
    name: "Aceite Vegetal 1 L",
    price: 2.8,
    image: "aceite",
    stock: 15,
    categoryId: "sub-aceite-vegetal"
  },
  {
    name: "Agua Mineral 1.5 L",
    price: 0.9,
    image: "agua",
    stock: 30,
    categoryId: "sub-agua-mineral"
  },
  {
    name: "Refresco de Cola 2 L",
    price: 2.2,
    image: "refresco_cola",
    stock: 20,
    categoryId: "sub-refresco-cola"
  },
  {
    name: "Detergente en Polvo 1 kg",
    price: 3.5,
    image: "detergente",
    stock: 4,
    categoryId: "sub-detergente"
  },
  {
    name: "Jabon de Barra",
    price: 0.75,
    image: "jabon",
    stock: 40,
    categoryId: "sub-jabon"
  },
  {
    // producto asignado directamente a una CATEGORIA (nivel intermedio)
    name: "Pack Refrescos Surtidos",
    price: 6.5,
    image: "refresco_cola",
    stock: 8,
    categoryId: "cat-refrescos"
  },
  {
    // producto asignado directamente a un DEPARTAMENTO (nivel superior)
    name: "Canasta Basica Limpieza",
    price: 9.9,
    image: "detergente",
    stock: 5,
    categoryId: "dep-limpieza"
  }
];
