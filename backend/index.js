const express = require("express");
const cors = require("cors");
const { db } = require("./db"); // Supondo que sua conexão Drizzle esteja aqui
const { livros } = require("./schema"); // Supondo que seu schema esteja aqui
const { eq } = require("drizzle-orm");

const app = express();
app.use(cors());
app.use(express.json());

// Rota para listar livros (Ordenados pelo campo 'ordem')
app.get("/api/livros", async (req, res) => {
  try {
    const data = await db.select().from(livros).orderBy(livros.ordem);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rota para reordenar livros
app.put("/api/livros/reordenar", async (req, res) => {
  const { listaOrdenada } = req.body; // Array de IDs: [10, 5, 8...]

  if (!listaOrdenada || !Array.isArray(listaOrdenada)) {
    return res.status(400).json({ error: "Lista inválida" });
  }

  try {
    // Atualiza a ordem de cada livro no banco
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

// Rota para criar livro
app.post("/api/livros", async (req, res) => {
  try {
    const novoLivro = await db.insert(livros).values(req.body).returning();
    res.json(novoLivro);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar livro" });
  }
});

// Criar novo livro
app.post("/api/livros", async (req, res) => {
  const { titulo, autor, ano, genero, paginas, status, capaUrl, isbn } =
    req.body;
  try {
    const result = await pool.query(
      `INSERT INTO livros (titulo, autor, ano, genero, paginas, status, capaUrl, isbn)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo,
        autor,
        ano,
        genero,
        paginas,
        status || "Não lido",
        capaUrl,
        isbn,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar livro" });
  }
});

// Atualizar livro
app.put("/api/livros/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, ano, genero, paginas, status, capaUrl, isbn } =
    req.body;
  try {
    const result = await pool.query(
      `UPDATE livros 
       SET titulo = $1, autor = $2, ano = $3, genero = $4, paginas = $5, 
           status = $6, capaUrl = $7, isbn = $8 
       WHERE id = $9 RETURNING *`,
      [titulo, autor, ano, genero, paginas, status, capaUrl, isbn, id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar livro" });
  }
});

// Deletar livro
app.delete("/api/livros/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM livros WHERE id = $1", [req.params.id]);
    res.json({ message: "Livro deletado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar livro" });
  }
});

// CORREÇÃO FINAL: Exportar para Vercel e porta para local
const PORT = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

module.exports = app;
