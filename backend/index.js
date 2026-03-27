const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Conexão com o banco (USANDO O NEON)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then(() => console.log("✅ Conectado ao PostgreSQL com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar:", err.message));

// ====================== ROTAS ======================

// Listar todos os livros
app.get("/livros", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM livros ORDER BY posicao ASC, id DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar livros:", error.message);
    res
      .status(500)
      .json({ error: "Erro ao buscar livros", details: error.message });
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

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Teste a API: http://localhost:${port}/api/livros`);
});
