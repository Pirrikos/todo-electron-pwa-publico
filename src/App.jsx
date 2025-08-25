import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "todoapp_v1_tasks";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const cls = (...p) => p.filter(Boolean).join(" ");

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks]);

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    return { done, total, active: total - done };
  }, [tasks]);

  const filtered = useMemo(() => {
    if (filter === "active") return tasks.filter(t => !t.done);
    if (filter === "done") return tasks.filter(t => t.done);
    return tasks;
  }, [tasks, filter]);

  // 🔁 MODIFICADO: al crear una tarea nueva, ahora incluye "attachments: []"
  function addTask() {
    const value = text.trim(); if (!value) return;
    setTasks(prev => [
      { id: uid(), text: value, done: false, createdAt: Date.now(), editing: false, attachments: [] },
      ...prev
    ]);
    setText(""); inputRef.current?.focus();
  }

  const toggle = id => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTasks(p => p.filter(t => t.id !== id));
  const clearDone = () => setTasks(p => p.filter(t => !t.done));
  const startEdit = id => setTasks(p => p.map(t => t.id === id ? { ...t, editing: true } : t));
  function saveEdit(id, newText) {
    const value = newText.trim();
    if (!value) { remove(id); return; }
    setTasks(p => p.map(t => t.id === id ? { ...t, text: value, editing: false } : t));
  }
  const cancelEdit = id => setTasks(p => p.map(t => t.id === id ? { ...t, editing: false } : t));
  function move(id, dir) {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === id); if (idx < 0) return prev;
      const target = dir === "up" ? idx - 1 : idx + 1; if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev]; const [item] = copy.splice(idx, 1); copy.splice(target, 0, item); return copy;
    });
  }

  // 🆕 AÑADIDO: funciones para gestionar adjuntos usando el preload (window.files)
  async function attachTo(id) {
    // abre diálogo del sistema y copia archivos a la carpeta segura de la app
    const picked = await window.files?.pickAndImport?.();
    if (!picked?.length) return;
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, attachments: [...(t.attachments || []), ...picked] } // merge con lo existente
          : t
      )
    );
  }

  function openAttachment(filePath) {
    // abre con la aplicación predeterminada de Windows
    window.files?.open?.(filePath);
  }

  async function removeAttachment(id, filePath) {
    // borra del disco y del estado
    await window.files?.remove?.(filePath);
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, attachments: (t.attachments || []).filter(a => a.path !== filePath) }
          : t
      )
    );
  }
  // 🆕 FIN AÑADIDOS (adjuntos)

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Mis tareas</h1>
          <button
            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
            onClick={() => { if (confirm("¿Borrar todas las tareas completadas?")) clearDone(); }}
          >
            Limpiar hechas
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTask(); }}
            placeholder="Escribe una tarea y pulsa Enter…"
            aria-label="Nueva tarea"
            className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            onClick={addTask}
            className="rounded-xl px-4 py-2 bg-blue-600 text-white hover:opacity-90 shadow-sm"
            aria-label="Añadir tarea"
          >
            Añadir
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="flex gap-1">
            {[
              { id: "all", label: "Todas" },
              { id: "active", label: "Activas" },
              { id: "done", label: "Hechas" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cls(
                  "px-3 py-1 rounded-full border",
                  filter === f.id ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-gray-600">
            {stats.active} pendientes • {stats.done} hechas • {stats.total} en total
          </div>
        </div>

        <ul className="space-y-2">
          {filtered.map(task => (
            <li key={task.id} className="group bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={task.done}
                onChange={() => toggle(task.id)}
              />

              <div className="flex-1 min-w-0">
                {task.editing ? (
                  <InlineEditor
                    initial={task.text}
                    onCancel={() => cancelEdit(task.id)}
                    onSave={(val) => saveEdit(task.id, val)}
                  />
                ) : (
                  <button
                    onDoubleClick={() => startEdit(task.id)}
                    className={cls("text-left w-full", task.done && "line-through text-gray-500")}
                    title="Doble clic para editar"
                  >
                    {task.text}
                  </button>
                )}

                <div className="text-xs text-gray-500 mt-1">
                  creada {new Date(task.createdAt).toLocaleString()}
                </div>

                {/* 🆕 AÑADIDO: bloque de UI para adjuntos por tarea */}
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Adjuntos</span>
                    <button
                      onClick={() => attachTo(task.id)}
                      className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50"
                      type="button"
                    >
                      Adjuntar…
                    </button>
                  </div>

                  {(task.attachments && task.attachments.length > 0) ? (
                    <ul className="space-y-1">
                      {task.attachments.map(file => (
                        <li key={file.path} className="text-sm flex items-center justify-between gap-2 border rounded-md px-2 py-1 bg-white">
                          <div className="min-w-0">
                            <div className="truncate">{file.name}</div>
                            <div className="text-xs text-gray-500 truncate">{Math.max(1, Math.round(file.size / 1024))} KB</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openAttachment(file.path)}
                              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                              type="button"
                            >
                              Abrir
                            </button>
                            <button
                              onClick={() => removeAttachment(task.id, file.path)}
                              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                              type="button"
                            >
                              Borrar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">No hay archivos adjuntos.</div>
                  )}
                </div>
                {/* 🆕 FIN bloque adjuntos */}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconButton label="Editar" onClick={() => startEdit(task.id)}>✏️</IconButton>
                <IconButton label="Subir" onClick={() => move(task.id, "up")}>⬆️</IconButton>
                <IconButton label="Bajar" onClick={() => move(task.id, "down")}>⬇️</IconButton>
                <IconButton label="Borrar" onClick={() => remove(task.id)}>🗑️</IconButton>
              </div>
            </li>
          ))}

          {filtered.length === 0 && (
            <li className="text-center text-sm text-gray-500 py-8 border rounded-xl bg-white">
              No hay tareas en este filtro.
            </li>
          )}
        </ul>

        <div className="mt-6 text-xs text-gray-500 leading-relaxed">
          <p className="mb-1 font-medium text-gray-700">Consejos rápidos</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pulsa Enter para añadir.</li>
            <li>Doble clic en una tarea para editarla.</li>
            <li>Usa los botones de subir/bajar para ordenar prioridades.</li>
            <li>"Limpiar hechas" borra todas las completadas.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InlineEditor({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
        className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button onClick={() => onSave(val)} className="rounded-xl px-3 py-2 border hover:bg-gray-50">Guardar</button>
      <button onClick={onCancel} className="rounded-xl px-3 py-2 border hover:bg-gray-50">Cancelar</button>
    </div>
  );
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-2 rounded-lg hover:bg-gray-100 border"
      type="button"
    >
      {children}
    </button>
  );
}
