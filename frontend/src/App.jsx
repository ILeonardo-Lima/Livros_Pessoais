import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
// Ícones modernos do Lucide React
import { Moon, Sun, Plus, Trash2, Edit3, BookOpen, Search } from "lucide-react";

const api = axios.create({ baseURL: "http://localhost:3001" });
const ItemType = "LIVRO";

// Componente do Card de Livro (Corrigido e Alinhado)
function LivroCard({
  livro,
  index,
  moveCard,
  editar,
  excluir,
  salvarOrdenacao,
  darkMode,
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    // Salvar no banco apenas ao soltar o card
    end: (item, monitor) => {
      if (monitor.didDrop()) salvarOrdenacao();
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
        <div className="mt-6 flex gap-3 pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-gray-100'}">
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

// Função Principal do App
function App() {
  const [livros, setLivros] = useState([]);
  const [search, setSearch] = useState("");
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
  const [modalOpen, setModalOpen] = useState(false); // Esta linha estava com erro no seu print

  // Estado para controlar se estamos editando ou criando um novo livro
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    status: "Não lido",
  });

  // CORREÇÃO DO ERRO DO PRINT: Função estável com useCallback
  const atualizarLista = useCallback(async () => {
    try {
      const res = await api.get("/api/livros");
      setLivros(res.data);
    } catch (error) {
      console.error("Erro ao carregar livros", error);
    }
  }, []); // Array de dependência vazio garante que a função não mude

  // CORREÇÃO DO ERRO DO PRINT: useEffect isolado para carregamento inicial
  useEffect(() => {
    let montado = true; // Boas práticas para evitar problemas de race condition

    const carregarDadosIniciais = async () => {
      try {
        const res = await api.get("/api/livros");
        if (montado) {
          setLivros(res.data);
        }
      } catch (error) {
        console.error("Erro no carregamento inicial", error);
      }
    };

    carregarDadosIniciais();

    // Função de limpeza: removemos a dependência que causava o alerta sublinhado
    return () => {
      montado = false;
    };
  }, []); // Array vazio aqui é o segredo para o erro sumir

  // Lógica de movimentação visual dos cards (DND)
  const moveCard = useCallback((fromIndex, toIndex) => {
    setLivros((prevLivros) => {
      const updatedLivros = [...prevLivros];
      const [movedBook] = updatedLivros.splice(fromIndex, 1);
      updatedLivros.splice(toIndex, 0, movedBook);
      return updatedLivros;
    });
  }, []);

  // Persistência da nova ordem no Banco de Dados
  const salvarOrdenacaoNoBanco = async () => {
    try {
      await api.put("/api/livros/reordenar", { livros });
      console.log("Ordem salva no banco!");
    } catch (error) {
      console.error("Erro ao salvar ordem", error);
    }
  };

  // Lógica de filtragem baseada na busca
  const filtered = livros.filter(
    (l) =>
      l.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      l.autor?.toLowerCase().includes(search.toLowerCase()) ||
      l.genero?.toLowerCase().includes(search.toLowerCase()) ||
      l.isbn?.toLowerCase().includes(search.toLowerCase()),
  );

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
      capaUrl: livro.capaUrl || livro.capaurl || "", // Garante compatibilidade com capaurl (minúsculo)
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
      console.error("Erro detalhado:", error); // Agora a variável está sendo usada!
      alert("Erro ao salvar");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Root Container com Modo Escuro (Fundo Preto / Slate 50) */}
      <div
        className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-black" : "bg-slate-50"}`}
      >
        {/* Navbar que ocupa a largura toda (Full Width) sticky no topo */}
        <nav className="bg-zinc-950 text-white py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              ESTANTE TECH
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de Dark Mode com ícones Lucide */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all ${darkMode ? "bg-zinc-800 text-yellow-400" : "bg-zinc-800 text-gray-400 hover:text-white"}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={handleNovoLivro}
              className="bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-500 hover:text-white transition flex items-center gap-2 text-sm"
            >
              <Plus size={18} />{" "}
              <span className="hidden sm:inline">Novo Livro</span>
            </button>
          </div>
        </nav>

        <main className="w-full px-6 md:px-12 py-10">
          {/* Dashboard de Estatísticas Segmentado */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {/* Total Geral */}
            <div
              className={`flex-1 min-w-37.5 max-w-50 p-4 rounded-3xl border shadow-sm transition-all ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-tighter text-gray-500 mb-1">
                Total
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {livros.length}
              </h2>
            </div>

            {/* Lidos - Verde */}
            <div
              className={`flex-1 min-w-37.5 max-w-50 p-4 rounded-3xl border shadow-sm transition-all ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-tighter text-green-500 mb-1">
                Lidos
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalLidos}
              </h2>
            </div>

            {/* Lendo - Âmbar */}
            <div
              className={`flex-1 min-w-37.5 max-w-50 p-4 rounded-3xl border shadow-sm transition-all ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-tighter text-amber-500 mb-1">
                Lendo
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalLendo}
              </h2>
            </div>

            {/* Não Lidos - Vermelho */}
            <div
              className={`flex-1 min-w-37.5 max-w-50 p-4 rounded-3xl border shadow-sm transition-all ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-tighter text-rose-500 mb-1">
                Fila de Espera
              </p>
              <h2
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-zinc-900"}`}
              >
                {totalNaoLidos}
              </h2>
            </div>
          </div>
          {/* Barra de Busca Moderna Ocupando todo o Espaço central */}
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

          {/* Grade Responsiva Ocupando Tudo (Full Width até 6 colunas) */}
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
                salvarOrdenacao={salvarOrdenacaoNoBanco}
              />
            ))}
          </div>
        </main>

        {/* Modal permanece igual, mas adicionei classes 'dark:' */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
              className={`rounded-3xl w-full max-w-2xl p-8 shadow-2xl border ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"}`}
            >
              <h2
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {editingId ? "Editar Livro" : "Novo Livro"}
              </h2>

              <form onSubmit={salvarLivro} className="space-y-4">
                {/* Linha 1: Título e Autor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
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
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
                    />
                  </div>
                </div>

                {/* Linha 2: Gênero e ISBN */}
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
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
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
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
                    />
                  </div>
                </div>

                {/* Linha 3: Páginas, Ano e Status */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-bold uppercase ${darkMode ? "text-zinc-500" : "text-gray-400"}`}
                    >
                      Páginas
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.paginas}
                      onChange={(e) =>
                        setForm({ ...form, paginas: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
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
                      placeholder="2024"
                      value={form.ano}
                      onChange={(e) =>
                        setForm({ ...form, ano: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
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
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
                    >
                      <option value="Não lido">Não lido</option>
                      <option value="Lendo">Lendo</option>
                      <option value="Lido">Lido</option>
                    </select>
                  </div>
                </div>

                {/* Campo de Imagem */}
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
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200"}`}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={
                      "flex-1 py-4 rounded-2xl font-bold bg-rose-800 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition"
                    }
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition"
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

export default App;
