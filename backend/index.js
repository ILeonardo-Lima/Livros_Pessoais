const express = require("express");
const cors = require("cors");
const { db } = require("./db"); // Agora ele vai achar o arquivo!
const { livros } = require("./schema"); // Agora ele vai achar o arquivo!
const { eq, asc } = require("drizzle-orm");

const app = express();
app.use(cors());
app.use(express.json());

// 1. LISTAR (Ordenado)
app.get("/api/livros", async (req, res) => {
  try {
    const data = await db.select().from(livros).orderBy(asc(livros.ordem));
    res.json(data);
  } catch (error) {
    console.error("Erro na busca:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// 2. REORDENAR (A correção do erro 500)
app.put("/api/livros/reordenar", async (req, res) => {
  const { listaOrdenada } = req.body;
  if (!listaOrdenada || !Array.isArray(listaOrdenada)) {
    return res.status(400).json({ error: "Lista inválida" });
  }
  try {
    for (let i = 0; i < listaOrdenada.length; i++) {
      await db
        .update(livros)
        .set({ ordem: i })
        .where(eq(livros.id, listaOrdenada[i]));
    }
    res.json({ message: "Ordem atualizada" });
  } catch (error) {
    console.error("Erro na reordenação:", error);
    res.status(500).json({ error: "Falha ao salvar ordem" });
  }
});

// 3. CRIAR (Removido o pool.query que causava o crash)
app.post("/api/livros", async (req, res) => {
  try {
    const novo = await db.insert(livros).values(req.body).returning();
    res.json(novo[0]);
  } catch (error) {
    console.error("Erro ao criar:", error);
    res.status(500).json({ error: "Erro ao criar livro" });
  }
});

// 4. ATUALIZAR
app.put("/api/livros/:id", async (req, res) => {
  try {
    const atualizado = await db
      .update(livros)
      .set(req.body)
      .where(eq(livros.id, req.params.id))
      .returning();
    res.json(atualizado[0]);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

// 5. DELETAR
app.delete("/api/livros/:id", async (req, res) => {
  try {
    await db.delete(livros).where(eq(livros.id, req.params.id));
    res.json({ message: "Deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar:", error);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// Exportação para Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor na porta ${PORT}`);
});

module.exports = app;
