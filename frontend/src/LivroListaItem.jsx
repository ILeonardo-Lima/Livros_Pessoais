import React, { useRef, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Edit3, Trash2 } from "lucide-react";

const LivroListaItem = ({
  livro,
  index,
  moveCard,
  darkMode,
  excluir,
  editar,
  salvarOrdemNoBanco,
}) => {
  // useRef é usado para acessar a DIV real no DOM (HTML)
  const ref = useRef(null);

  // LOGICA DE "DROP" (RECEBER ALGO EM CIMA)
  const [{ handlerId }, drop] = useDrop({
    accept: "CARD",
    // Só aceita itens do tipo "CARD"
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
    }),
    drop: () => ({ moved: true }),
    hover: (item, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index; // Onde o item arrastado estava
      const hoverIndex = index; // Onde o item está passando por cima agora

      // Se for a mesma posição, não faz nada
      if (dragIndex === hoverIndex) return;

      // Cálculo para saber se o mouse passou da metade do item (melhora a fluidez)
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Só move se o arraste for além da metade do componente
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Executa a função de mover os dados no array original
      moveCard(dragIndex, hoverIndex);

      // Atualiza o índice do item que está sendo arrastado para o novo lugar
      item.index = hoverIndex;
    },
  });

  // LOGICA DE "DRAG" (SER ARRASTADO)
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: () => ({ id: livro.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // ESTE É O BLOCO CORRETO:
    end: (item, monitor) => {
      const didDrop = monitor.didDrop(); // Verifica se o "pouso" foi em lugar válido

      if (didDrop && salvarOrdemNoBanco) {
        console.log(
          "Sucesso! O livro foi solto em uma nova posição. Salvando no Neon...",
        );
        salvarOrdemNoBanco();
      }
    },
  });

  // Conecta as lógicas de Drag e Drop à nossa referência 'ref'
  useEffect(() => {
    if (ref.current) {
      drag(drop(ref));
    }
  }, [drag, drop]);

  return (
    <div
      ref={ref} // Conecta o HTML com a lógica do React DnD
      data-handler-id={handlerId}
      className={`flex items-center gap-4 p-4 border-b transition-all ${
        isDragging ? "opacity-0" : "opacity-100" // Esconde o item original enquanto ele é arrastado
      } ${
        darkMode
          ? "bg-zinc-950/40 border-zinc-800 hover:bg-zinc-900/60"
          : "bg-white border-gray-100 hover:bg-gray-50"
      } cursor-move`} // cursor-move muda o mouse para a "mãozinha" de arrastar
    >
      {/* 1. Capa */}
      <div className="w-16 h-24 bg-zinc-800 rounded shadow-md overflow-hidden shrink-0">
        {livro.capaUrl ? (
          <img
            src={livro.capaUrl}
            className="w-full h-full object-cover"
            alt={livro.titulo}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 bg-zinc-900">
            Sem Capa
          </div>
        )}
      </div>

      {/* 2. Info Central */}
      <div className="flex-1 min-w-0 text-sm">
        <h5
          className={`font-bold text-xs md:text-lg truncate ${darkMode ? "text-zinc-100" : "text-zinc-900"}`}
        >
          {livro.titulo}
        </h5>
        <p className="text-xs font-semibold text-zinc-400 truncate mb-2">
          {livro.autor}
        </p>

        {/* Badge de Status com cores condicionais */}
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
            livro.status === "Lido"
              ? "bg-green-500/10 text-green-500"
              : livro.status === "Lendo"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-red-500/10 text-red-500"
          }`}
        >
          {livro.status}
        </span>
      </div>

      {/* 3. Ações (Editar e Excluir) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => editar(livro)}
          className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400  hover:bg-indigo-600 hover:text-white transition-colors"
        >
          <Edit3 size={18} />
        </button>
        <button
          onClick={() => excluir(livro.id)}
          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default LivroListaItem;
