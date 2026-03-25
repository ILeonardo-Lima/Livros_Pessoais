import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [livros, setLivros] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    ano: "",
    genero: "",
    paginas: "",
    status: "Não lido",
    capaUrl: "",
    isbn: "",
  });

  const api = axios.create({ baseURL: "http://localhost:3001" });

  // Função para carregar os livros
  const carregarLivros = async () => {
    try {
      const res = await api.get("/api/livros");
      setLivros(res.data);
    } catch (error) {
      console.error("Erro ao carregar livros", error);
    }
  };

  // Carrega os livros quando o componente monta
  useEffect(() => {
    const fetchLivros = async () => {
      try {
        const response = await api.get("/livros");
        setLivros(response.data); // This is now handled after the promise resolves
      } catch (error) {
        console.error("Erro ao carregar livros:", error);
      }
    };

    fetchLivros();
  }, []);

  const salvarLivro = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/livros/${editingId}`, form);
      } else {
        await api.post("/api/livros", form);
      }
      setModalOpen(false);
      setForm({
        titulo: "",
        autor: "",
        ano: "",
        genero: "",
        paginas: "",
        status: "Não lido",
        capaUrl: "",
        isbn: "",
      });
      setEditingId(null);
      carregarLivros();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o livro");
    }
  };

  const editar = (livro) => {
    setForm(livro);
    setEditingId(livro.id);
    setModalOpen(true);
  };

  const excluir = async (id) => {
    if (window.confirm("Deseja realmente excluir este livro?")) {
      await api.delete(`/api/livros/${id}`);
      carregarLivros();
    }
  };

  const filtered = livros.filter(
    (l) =>
      l.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      l.autor?.toLowerCase().includes(search.toLowerCase()) ||
      l.isbn?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-indigo-700 text-white py-5 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">📚 Minha Biblioteca</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-white text-indigo-700 px-6 py-3 rounded-2xl font-semibold hover:bg-indigo-100"
          >
            + Novo Livro
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <input
          type="text"
          placeholder="🔎 Buscar por título, autor ou ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xl mx-auto block mb-10 px-6 py-4 rounded-3xl border border-gray-300 focus:border-indigo-500 focus:outline-none text-lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((livro) => (
            <div
              key={livro.id}
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
            >
              {livro.capaUrl ? (
                <img
                  src={livro.capaUrl}
                  alt="capa"
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="h-56 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-6xl">
                  📖
                </div>
              )}
              <div className="p-6">
                <h3 className="font-bold text-xl">{livro.titulo}</h3>
                <p className="text-indigo-600">{livro.autor}</p>
                {livro.isbn && (
                  <p className="text-xs text-gray-500 mt-1">
                    ISBN: {livro.isbn}
                  </p>
                )}
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p>Ano: {livro.ano || "—"}</p>
                  <p>Páginas: {livro.paginas || "—"}</p>
                  <p>Gênero: {livro.genero || "—"}</p>
                  <p
                    className={
                      livro.status === "Lido"
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {livro.status}
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => editar(livro)}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl hover:bg-indigo-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluir(livro.id)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-2xl hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? "Editar Livro" : "Novo Livro"}
            </h2>
            <form onSubmit={salvarLivro} className="space-y-5">
              <input
                type="text"
                placeholder="Título *"
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              />
              <input
                type="text"
                placeholder="Autor *"
                required
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Ano"
                  value={form.ano}
                  onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
                />
                <input
                  type="text"
                  placeholder="Gênero"
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
                />
              </div>
              <input
                type="number"
                placeholder="Páginas"
                value={form.paginas}
                onChange={(e) => setForm({ ...form, paginas: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              />
              <input
                type="text"
                placeholder="ISBN"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              >
                <option value="Não lido">Não lido</option>
                <option value="Lendo">Lendo</option>
                <option value="Lido">Lido</option>
              </select>
              <input
                type="text"
                placeholder="URL da capa (opcional)"
                value={form.capaUrl}
                onChange={(e) => setForm({ ...form, capaUrl: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl"
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-3 text-gray-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-700 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-800"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
