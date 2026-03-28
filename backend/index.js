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
// ... (mantenha o topo igual)

// Rota para criar livro (Corrigida para Drizzle)
app.post("/api/livros", async (req, res) => {
  try {
    const novo = await db.insert(livros).values(req.body).returning();
    res.json(novo[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar livro" });
  }
});

// Rota para atualizar (Corrigida para Drizzle)
app.put("/api/livros/:id", async (req, res) => {
  try {
    const atualizado = await db
      .update(livros)
      .set(req.body)
      .where(eq(livros.id, req.params.id))
      .returning();
    res.json(atualizado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

// Rota para deletar (Corrigida para Drizzle)
app.delete("/api/livros/:id", async (req, res) => {
  try {
    await db.delete(livros).where(eq(livros.id, req.params.id));
    res.json({ message: "Sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// Mude 'port' para 'PORT' (maiúsculo) para evitar erro de referência
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;
