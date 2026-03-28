const { pgTable, serial, text, integer } = require("drizzle-orm/pg-core");

const livros = pgTable("livros", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  autor: text("autor").notNull(),
  ano: integer("ano"),
  genero: text("genero"),
  paginas: integer("paginas"),
  status: text("status").default("Não lido"),
  capaUrl: text("capaurl"), // Verifique se no Neon está 'capaurl' ou 'capaUrl'
  isbn: text("isbn"),
  ordem: integer("ordem").default(0),
});

module.exports = { livros };
