const express = require("express");
const cors = require("cors");
const { db } = require("./db");
const { livros } = require("./schema");
const { eq, asc } = require("drizzle-orm");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Listar livros (Ordenados pelo campo 'ordem')
app.get("/api/livros", async (req, res) => {
  try {
    // Usando asc para garantir a ordem crescente
    const data = await db.select().from(livros).orderBy(asc(livros.ordem));
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 2. Reordenar livros (A rota que estava dando erro 500)
app.put("/api/livros/reordenar", async (req, res) => {
  const { listaOrdenada } = req.body;

  if (!listaOrdenada || !Array.isArray(listaOrdenada)) {
    return res.status(400).json({ error: "Lista inválida" });
  }

  try {
    // Atualiza a ordem de cada livro no banco via Drizzle
    for (let i = 0; i < listaOrdenada.length; i++) {
      await db
        .update(livros)
        .set({ ordem: i })
        .where(eq(livros.id, listaOrdenada[i]));
    }
    res.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao reordenar:", error);
    res.status(500).json({ error: "Erro ao salvar nova ordem" });
  }
});

// 3. Criar novo livro (Corrigido para usar Drizzle)
app.post("/api/livros", async (req, res) => {
  try {
    const { titulo, autor, ano, genero, paginas, status, capaUrl, isbn } =
      req.body;

    const novoLivro = await db
      .insert(livros)
      .values({
        titulo,
        autor,
        ano: ano ? parseInt(ano) : null,
        genero,
        paginas: paginas ? parseInt(paginas) : null,
        status: status || "Não lido",
        capaUrl,
        isbn,
        ordem: 0, // Valor padrão para novos livros
      })
      .returning();

    res.status(201).json(novoLivro[0]);
  } catch (error) {
    console.error("Erro ao criar:", error);
    res.status(500).json({ error: "Erro ao criar livro" });
  }
});

// 4. Atualizar livro (Corrigido para usar Drizzle)
app.put("/api/livros/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { titulo, autor, ano, genero, paginas, status, capaUrl, isbn } =
      req.body;

    const result = await db
      .update(livros)
      .set({
        titulo,
        autor,
        ano: ano ? parseInt(ano) : null,
        genero,
        paginas: paginas ? parseInt(paginas) : null,
        status,
        capaUrl,
        isbn,
      })
      .where(eq(livros.id, id))
      .returning();

    res.json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    res.status(500).json({ error: "Erro ao atualizar livro" });
  }
});

// 5. Deletar livro (Corrigido para usar Drizzle)
app.delete("/api/livros/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(livros).where(eq(livros.id, id));
    res.json({ message: "Livro deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar:", error);
    res.status(500).json({ error: "Erro ao deletar livro" });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;
