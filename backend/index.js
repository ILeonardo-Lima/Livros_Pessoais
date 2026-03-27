const express = require("express");
const { Pool } = require("pg");
const cors = require("cors"); // IMPORTANTE
require("dotenv").config();

const app = express();
app.use(cors()); // LIBERA O ACESSO
app.use(express.json());

// CONEXÃO CORRETA COM O NEON
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ROTA DE TESTE (Para não dar "Cannot GET /")
app.get("/", (req, res) => res.send("API Rodando no Neon!"));

// SUA ROTA DE LIVROS
app.get("/api/livros", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM livros ORDER BY posicao ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para salvar a nova ordenação
app.put("/api/livros/reordenar", async (req, res) => {
  const { livros } = req.body; // Recebe o array ordenado do frontend

  try {
    // Usamos uma Promise.all para garantir que todos os updates terminem
    await Promise.all(
      livros.map((livro, index) => {
        return pool.query("UPDATE livros SET posicao = $1 WHERE id = $2", [
          index,
          livro.id,
        ]);
      }),
    );

    res.status(200).json({ message: "Ordem atualizada com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar ordenação" });
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
const port = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  });
}

module.exports = app;
