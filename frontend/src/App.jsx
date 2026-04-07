import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
// Ícones modernos do Lucide React
import {
  Moon,
  Sun,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";
const api = axios.create({
  baseURL: "https://livros-pessoais-api.vercel.app",
});
const ItemType = "LIVRO";

// Componente do Card de Livro (Corrigido e Alinhado)
function LivroCard({
  livro,
  index,
  moveCard,
  editar,
  excluir,
  salvarOrdemNoBanco, // Nome corrigido aqui
  darkMode,
  livros, // Precisamos da lista atual para salvar
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    // Aqui é o segredo: quando parar de arrastar, ele salva a lista atual
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

  // Estilo dinâmico do card baseado no Modo Escuro
  const cardTheme = darkMode
    ? "bg-zinc-900 border-zinc-800 text-white"
    : "bg-white border-gray-100 text-gray-900";

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`rounded-3xl shadow-xl overflow-hidden transition-all duration-300 cursor-move flex flex-col h-full border ${cardTheme} ${
        isDragging ? "opacity-50 scale-95" : "hover:shadow-2xl"
      }`}
    >
      {/* Área da Capa com Altura Reduzida (h-72) */}
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
            {/* 1. Gênero (Mantido e formatado) */}
            <p>
              <span className="font-bold">Gênero:</span> {livro.genero || "—"}
            </p>

            {/* 2. ISBN (Condicional: só aparece se existir) */}
            {livro.isbn && (
              <p>
                <span className="font-bold">ISBN:</span> {livro.isbn}
              </p>
            )}

            {/* 3. Número de Páginas */}
            <p>
              <span className="font-bold">Páginas:</span> {livro.paginas || "—"}
            </p>

            {/* 4.Ano*/}
            <p>
              <span className="font-bold">Ano:</span> {livro.ano || "—"}
            </p>

            {/* Status (Mantido no final) */}
            <p
              className={`font-bold mt-3 border-t ${darkMode ? "border-zinc-800" : "border-gray-100"} pt-2 ${
                livro.status === "Lido"
                  ? "text-green-500"
                  : livro.status === "Lendo"
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {livro.status}
            </p>
          </div>
        </div>

        {/* Botões do Rodapé perfeitamente alinhados */}
        <div
          className={`mt-6 flex gap-3 pt-4 border-t ${darkMode ? "border-zinc-800" : "border-gray-100"}`}
        >
          <button
            onClick={() => editar(livro)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-400 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
          >
            <Edit3 size={18} />
            <span className="hidden sm:inline">Editar</span>
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

// CORREÇÃO: Exportação direta para evitar erro de redeclaração de bloco
export default function App() {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' ou 'list'
  const [livros, setLivros] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [darkMode, setDarkMode] = useState(() => {
    const salvo = localStorage.getItem("tema_biblioteca");
    return salvo ? JSON.parse(salvo) : true;
  });
  const totalLidos = livros.filter((l) => l.status === "Lido").length;
  const totalLendo = livros.filter((l) => l.status === "Lendo").length;
  const totalNaoLidos = livros.filter((l) => l.status === "Não lido").length;

  useEffect(() => {
    localStorage.setItem("tema_biblioteca", JSON.stringify(darkMode));
  }, [darkMode]);

  const [modalOpen, setModalOpen] = useState(false);

  // Estado para controlar se estamos editando ou criando um novo livro
  const [editingId, setEditingId] = useState(null);
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

  // CORREÇÃO 1: Busca a lista APENAS na montagem (uma única vez)
  useEffect(() => {
    atualizarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CORREÇÃO 2: Salva o tema apenas quando o darkMode REALMENTE mudar
  useEffect(() => {
    localStorage.setItem("tema_biblioteca", JSON.stringify(darkMode));
  }, [darkMode]);

  // Lógica de movimentação visual dos cards (DND)
  const moveCard = useCallback((fromIndex, toIndex) => {
    setLivros((prevLivros) => {
      const updatedLivros = [...prevLivros];
      const [movedBook] = updatedLivros.splice(fromIndex, 1);
      updatedLivros.splice(toIndex, 0, movedBook);
      return updatedLivros;
    });
  }, []);

  // CORREÇÃO: Removida a duplicata desta função que causava erro na linha 213/227
  const salvarOrdemNoBanco = async (novaLista) => {
    try {
      const idsNaOrdem = novaLista.map((livro) => livro.id);
      await api.put("/api/livros/reordenar", {
        listaOrdenada: idsNaOrdem,
      });
      console.log("Ordem salva com sucesso no banco!");
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
    }
  };

  // Lógica de filtragem baseada na busca
  const filtered = livros.filter((l) => {
    const termo = search.toLowerCase();

    // Primeiro, verifica se o status bate com o filtro selecionado
    const bateStatus = statusFilter === "Todos" || l.status === statusFilter;

    // Depois, verifica se o texto da busca bate com os campos
    const bateBusca =
      l.titulo?.toLowerCase().includes(termo) ||
      l.autor?.toLowerCase().includes(termo) ||
      l.genero?.toLowerCase().includes(termo) ||
      l.isbn?.includes(termo);

    return bateStatus && bateBusca;
  });

  // Lógica para abrir modal para criação
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

  // Lógica para abrir modal para edição
  const handleEditarLivro = (livro) => {
    setForm({
      titulo: livro.titulo || "",
      autor: livro.autor || "",
      genero: livro.genero || "",
      isbn: livro.isbn || "",
      paginas: livro.paginas || "",
      ano: livro.ano || "",
      status: livro.status || "Não lido",
      capaUrl: livro.capaUrl || livro.capaurl || "",
    });
    setEditingId(livro.id);
    setModalOpen(true);
  };

  // Lógica para excluir livro
  const handleExcluirLivro = async (id) => {
    if (window.confirm("Deseja realmente excluir este livro?")) {
      try {
        await api.delete(`/api/livros/${id}`);
        atualizarLista();
      } catch (error) {
        console.error("Erro ao excluir", error);
      }
    }
  };

  // Lógica para salvar livro (Novo ou Editado)
  const salvarLivro = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/livros/${editingId}`, form);
      } else {
        await api.post("/api/livros", form);
      }
      setModalOpen(false);
      atualizarLista();
      alert("✅ Livro salvo com sucesso!");
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao salvar");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-black" : "bg-slate-50"}`}
      >
        <nav className="bg-zinc-800 text-white py-2 px-4 md:py-4 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>

            <h1 className="text-lg sm:text-2xl font-black leading-tight">
              MINHA ESTANTE
            </h1>
          </div>
          <h3 className="text-zinc-800">
            Developed by Leonardo de Oliveira Lima - 2026
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                darkMode
                  ? "bg-zinc-800 text-yellow-400"
                  : "bg-zinc-800 text-gray-400"
              } hover:bg-zinc-700`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex gap-2">
              {/* Botão de Alternar View */}
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className={`p-2.5 rounded-xl border transition-all ${
                  darkMode
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:text-indigo-600"
                }`}
                title={viewMode === "grid" ? "Ver em Lista" : "Ver em Grade"}
              >
                {viewMode === "grid" ? (
                  <List size={20} />
                ) : (
                  <LayoutGrid size={20} />
                )}
              </button>
            </div>
            <button
              onClick={handleNovoLivro}
              className="bg-white text-black w-10 h-10 sm:w-auto sm:px-5 sm:py-2.5 rounded-xl font-bold hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center sm:gap-2 text-sm shadow-md active:scale-95"
            >
              <Plus size={20} />{" "}
              <span className="hidden sm:inline">Novo Livro</span>
            </button>
          </div>
        </nav>

        <main className="w-full px-3 md:px-12 py-6 sm:py-10">
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {/* Botão Todos */}
            <button
              onClick={() => setStatusFilter("Todos")}
              className={`flex-1 min-w-30 sm:min-w-37.5 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border shadow-sm transition-all text-center${
                statusFilter === "Todos"
                  ? "ring-4 ring-indigo-500 scale-105 shadow-indigo-500/20"
                  : ""
              } ${darkMode ? "bg-zinc-900 border-purple-800 hover:bg-zinc-800" : "bg-white border-purple-800 hover:bg-indigo-100"}`}
            >
              <p className="text-[15px] font-black uppercase tracking-tighter text-purple-500 mb-1">
                Total
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {livros.length}
              </h2>
            </button>

            {/* Botão Lidos */}
            <button
              onClick={() => setStatusFilter("Lido")}
              className={`flex-1 min-w-30 sm:min-w-37.5 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border shadow-sm transition-all text-center${
                statusFilter === "Lido" ? "ring-2 ring-green-500 scale-105" : ""
              } ${darkMode ? "bg-zinc-900 border-green-800 hover:bg-zinc-800" : "bg-white border-green-800 hover:bg-green-100"}`}
            >
              <p className="text-[15px] font-black uppercase tracking-tighter text-green-500 mb-1">
                Lidos
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalLidos}
              </h2>
            </button>

            {/* Botão Lendo */}
            <button
              onClick={() => setStatusFilter("Lendo")}
              className={`flex-1 min-w-30 sm:min-w-37.5 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border shadow-sm transition-all text-center${
                statusFilter === "Lendo"
                  ? "ring-2 ring-amber-500 scale-105"
                  : ""
              } ${darkMode ? "bg-zinc-900 border-amber-500 hover:bg-zinc-800" : "bg-white border-amber-500 hover:bg-amber-100"}`}
            >
              <p className="text-[15px] font-black uppercase tracking-tighter text-amber-500 mb-1">
                Lendo
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalLendo}
              </h2>
            </button>

            {/* Botão Não Lidos */}
            <button
              onClick={() => setStatusFilter("Não lido")}
              className={`flex-1 min-w-30 sm:min-w-37.5 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border shadow-sm transition-all text-center${
                statusFilter === "Não lido"
                  ? "ring-2 ring-rose-500 scale-105"
                  : ""
              } ${darkMode ? "bg-zinc-900 border-rose-800 hover:bg-zinc-800" : "bg-white border-rose-800 hover:bg-rose-100"}`}
            >
              <p className="text-[15px] font-black uppercase tracking-tighter text-rose-500 mb-1">
                Fila de Espera
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalNaoLidos}
              </h2>
            </button>
          </div>

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
              className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-sm ${
                darkMode
                  ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                  : "bg-white border-gray-100"
              }`}
            />
          </div>

          {/* Alteramos a classe da div pai dependendo do modo selecionado */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6"
                : "flex flex-col gap-3 w-full"
            }
          >
            {filtered.map((livro, index) =>
              viewMode === "grid" ? (
                // MODO GRADE (Seu componente atual)
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
              ) : (
                // NOVO MODO LISTA (Estilo Apple Books)
                <div
                  key={livro.id}
                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                    darkMode
                      ? "bg-zinc-900/40 border-zinc-800"
                      : "bg-white border-gray-100 shadow-sm"
                  }`}
                >
                  {/* Capa à esquerda */}
                  {/* Onde renderizamos a capa no modo lista */}
                  <div className="w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden shrink-0 shadow-lg">
                    {livro.capaUrl ? (
                      <img
                        src={livro.capaUrl} // <-- Verifique se o nome é 'capa' ou 'imageUrl'
                        className="w-full h-full object-cover"
                        alt={livro.titulo}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150";
                        }} // Fallback caso a URL falhe
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 bg-zinc-900">
                        Sem Capa
                      </div>
                    )}
                  </div>

                  {/* Info central (Título, Autor, Gênero, Status) */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-base truncate ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {livro.titulo}
                    </h3>
                    <p className="text-sm text-zinc-400 truncate">
                      {livro.autor}
                    </p>
                    <p className="text-xs text-zinc-500 italic mt-0.5">
                      {livro.genero}
                    </p>

                    <div className="mt-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                          darkMode
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        <p
                          className={`font-bold  ${
                            livro.status === "Lido"
                              ? "text-green-500"
                              : livro.status === "Lendo"
                                ? "text-amber-500"
                                : "text-red-500"
                          }`}
                        >
                          {livro.status}
                        </p>
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação (Editar/Excluir) */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditarLivro(livro)}
                      className="p-2 text-zinc-500 hover:text-indigo-500"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleExcluirLivro(livro.id)}
                      className="p-2 text-zinc-500 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </main>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
              className={`rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl border ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <h2
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {editingId ? "Editar Livro" : "Novo Livro"}
              </h2>

              <form onSubmit={salvarLivro} className="space-y-3 sm:space-y-4">
                <div
                  className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Título
                    </label>
                    <input
                      required
                      placeholder="Ex: O Ladrão de Raios"
                      value={form.titulo}
                      onChange={(e) =>
                        setForm({ ...form, titulo: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Autor
                    </label>
                    <input
                      required
                      placeholder="Ex: Rick Riordan"
                      value={form.autor}
                      onChange={(e) =>
                        setForm({ ...form, autor: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Gênero
                    </label>
                    <input
                      placeholder="Ex: Fantasia"
                      value={form.genero}
                      onChange={(e) =>
                        setForm({ ...form, genero: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      ISBN
                    </label>
                    <input
                      placeholder="Ex: 978-85..."
                      value={form.isbn}
                      onChange={(e) =>
                        setForm({ ...form, isbn: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Páginas
                    </label>
                    <input
                      type="number"
                      value={form.paginas}
                      onChange={(e) =>
                        setForm({ ...form, paginas: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Ano
                    </label>
                    <input
                      type="number"
                      value={form.ano}
                      onChange={(e) =>
                        setForm({ ...form, ano: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                    >
                      <option value="Não lido">Não lido</option>
                      <option value="Lendo">Lendo</option>
                      <option value="Lido">Lido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                  >
                    URL da Capa
                  </label>
                  <input
                    placeholder="https://..."
                    value={form.capaUrl}
                    onChange={(e) =>
                      setForm({ ...form, capaUrl: e.target.value })
                    }
                    className={`w-full py-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" : "bg-gray-50 border-gray-100"} focus:outline-none focus:border-indigo-500 transition-all text-sm`}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold bg-rose-800 text-white hover:bg-rose-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
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
