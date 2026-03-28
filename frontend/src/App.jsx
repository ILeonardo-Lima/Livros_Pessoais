import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Moon, Sun, Plus, Trash2, Edit3, BookOpen, Search } from "lucide-react";

const api = axios.create({
  baseURL: "https://livros-pessoais-api.vercel.app",
});

const ItemType = "LIVRO";

function LivroCard({
  livro,
  index,
  moveCard,
  editar,
  excluir,
  salvarOrdemNoBanco,
  darkMode,
  livros,
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        salvarOrdemNoBanco(livros);
      }
    },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveCard(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const cardTheme = darkMode
    ? "bg-zinc-900 border-zinc-800 text-white"
    : "bg-white border-gray-100 text-gray-900";

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`rounded-3xl shadow-xl overflow-hidden transition-all duration-300 cursor-move flex flex-col h-full border ${cardTheme} ${isDragging ? "opacity-50 scale-95" : "hover:shadow-2xl"}`}
    >
      <div
        className={`h-72 flex items-center justify-center p-6 ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}
      >
        {livro.capaUrl || livro.capaurl ? (
          <img
            src={livro.capaUrl || livro.capaurl}
            alt="capa"
            className="max-h-full max-w-full object-contain shadow-lg"
          />
        ) : (
          <BookOpen size={64} className="opacity-20" />
        )}
      </div>
      <div className="p-6 flex flex-col grow">
        <div className="grow">
          <h3 className="font-bold text-xl leading-tight mb-1">
            {livro.titulo}
          </h3>
          <p className="text-indigo-500 dark:text-indigo-400 font-medium mb-3 text-sm">
            {livro.autor}
          </p>
          <div
            className={`text-xs space-y-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            <p>
              <span className="font-bold">Gênero:</span> {livro.genero || "—"}
            </p>
            {livro.isbn && (
              <p>
                <span className="font-bold">ISBN:</span> {livro.isbn}
              </p>
            )}
            <p>
              <span className="font-bold">Páginas:</span> {livro.paginas || "—"}
            </p>
            <p>
              <span className="font-bold">Ano:</span> {livro.ano || "—"}
            </p>
            <p
              className={`font-bold mt-3 border-t ${darkMode ? "border-zinc-800" : "border-gray-100"} pt-2 ${livro.status === "Lido" ? "text-green-500" : livro.status === "Lendo" ? "text-amber-500" : "text-red-500"}`}
            >
              {livro.status}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3 pt-4 border-t">
          <button
            onClick={() => editar(livro)}
            className="flex-1 bg-indigo-400 hover:bg-indigo-800 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm"
          >
            <Edit3 size={16} /> Editar
          </button>
          <button
            onClick={() => excluir(livro.id)}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition flex items-center justify-center"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [livros, setLivros] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => JSON.parse(localStorage.getItem("tema_biblioteca")) ?? true,
  );
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    status: "Não lido",
  });

  const atualizarLista = useCallback(async () => {
    try {
      const res = await api.get("/api/livros");
      setLivros(res.data);
    } catch (error) {
      console.error("Erro ao carregar livros", error);
    }
  }, []);

  useEffect(() => {
    atualizarLista();
    localStorage.setItem("tema_biblioteca", JSON.stringify(darkMode));
  }, [darkMode, atualizarLista]);

  const moveCard = useCallback((fromIndex, toIndex) => {
    setLivros((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const salvarOrdemNoBanco = async (novaLista) => {
    try {
      const idsNaOrdem = novaLista.map((l) => l.id);
      await api.put("/api/livros/reordenar", { listaOrdenada: idsNaOrdem });
      console.log("Ordem salva!");
    } catch (error) {
      console.error("Erro ao salvar ordem", error);
    }
  };

  const filtered = livros.filter((l) => {
    const termo = search.toLowerCase();
    const bateStatus = statusFilter === "Todos" || l.status === statusFilter;
    const bateBusca =
      l.titulo?.toLowerCase().includes(termo) ||
      l.autor?.toLowerCase().includes(termo);
    return bateStatus && bateBusca;
  });

  const handleNovoLivro = () => {
    setForm({
      titulo: "",
      autor: "",
      genero: "",
      isbn: "",
      paginas: "",
      ano: "",
      status: "Não lido",
      capaUrl: "",
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEditarLivro = (livro) => {
    setForm({ ...livro, capaUrl: livro.capaUrl || livro.capaurl || "" });
    setEditingId(livro.id);
    setModalOpen(true);
  };

  const handleExcluirLivro = async (id) => {
    if (window.confirm("Excluir livro?")) {
      await api.delete(`/api/livros/${id}`);
      atualizarLista();
    }
  };

  const salvarLivro = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/livros/${editingId}`, form);
      else await api.post("/api/livros", form);
      setModalOpen(false);
      atualizarLista();
    } catch (error) {
      alert("Erro ao salvar");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-black" : "bg-slate-50"}`}
      >
        <nav className="bg-zinc-800 text-white py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              MINHA ESTANTE
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-zinc-800 text-yellow-400"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleNovoLivro}
              className="bg-white text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Novo Livro
            </button>
          </div>
        </nav>

        <main className="w-full px-6 md:px-12 py-10">
          <div className="relative max-w-2xl mx-auto mb-12">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Qual livro você está procurando?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-sm ${darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100"}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filtered.map((livro, index) => (
              <LivroCard
                key={livro.id}
                livro={livro}
                index={index}
                moveCard={moveCard}
                darkMode={darkMode}
                excluir={handleExcluirLivro}
                editar={handleEditarLivro}
                salvarOrdemNoBanco={salvarOrdemNoBanco}
                livros={livros}
              />
            ))}
          </div>
        </main>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
              className={`rounded-3xl w-full max-w-2xl p-8 border ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <h2
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {editingId ? "Editar Livro" : "Novo Livro"}
              </h2>
              <form onSubmit={salvarLivro} className="space-y-4">
                <input
                  required
                  placeholder="Título"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-inherit"
                />
                <input
                  required
                  placeholder="Autor"
                  value={form.autor}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-inherit"
                />
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-rose-800 text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white"
                  >
                    Salvar Livro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
