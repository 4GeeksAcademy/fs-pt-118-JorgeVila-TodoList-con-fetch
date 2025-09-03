import React, { useEffect, useState } from "react";
import "../TodoListFetch/TodoListFetch.css"; // Importa los estilos de este componente

// ✅ Base URL de la API de 4Geeks ToDo
const API_BASE_URL = "https://playground.4geeks.com/todo";

/**
 * Componente principal de la app de tareas.
 * Flujo:
 *  1) Comprueba si existe el usuario; si no, lo crea.
 *  2) Descarga las tareas del usuario.
 *  3) Permite añadir tareas (POST) y borrarlas (DELETE).
 */
export const TodoListFetch = () => {
  // 🧑‍💻 Nombre del usuario cuyas tareas vamos a gestionar.
  
  const username = "jorgevila";

  // 🧠 Estado local
  const [todos, setTodos] = useState([]);       // Lista de tareas
  const [label, setLabel] = useState("");       // Texto del input (nueva tarea)
  const [loading, setLoading] = useState(true); // Indicador de carga
  const [err, setErr] = useState(null);         // Mensaje de error (si ocurre)

  /**
   * 🔧 La API a veces devuelve { todos: [...] } y otras un array directo.
   *    Esta función normaliza para quedarnos siempre con un array.
   */
  const toArray = (data) => (Array.isArray(data) ? data : data?.todos ?? []);

  /**
   * 📥 Carga inicial: asegura que el usuario exista y trae sus tareas.
   *    - GET /users/:username
   *    - Si 404 → crea usuario con POST /users/:username y vuelve a pedir.
   */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Intentar obtener tareas del usuario
        let res = await fetch(`${API_BASE_URL}/users/${username}`);

        // 2) Si el usuario no existe, lo creamos y volvemos a consultar
        if (res.status === 404) {
          const createRes = await fetch(`${API_BASE_URL}/users/${username}`, { method: "POST" });
          if (!createRes.ok) throw new Error(`No se pudo crear el usuario (${createRes.status})`);
          res = await fetch(`${API_BASE_URL}/users/${username}`);
        }

        // 3) Validación final del GET
        if (!res.ok) throw new Error(`Error al cargar tareas (${res.status})`);

        // 4) Guardar tareas en estado
        const data = await res.json();
        setTodos(toArray(data));
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  /**
   * ➕ Añadir una nueva tarea
   *    - POST /todos/:username con { label, done }
   *    - Luego recargar tareas con GET /users/:username
   */
  const addTodo = async (e) => {
    e.preventDefault();

    // Evitar enviar textos vacíos (o solo espacios)
    const newLabel = label.trim();
    if (!newLabel) return;

    try {
      setLoading(true);
      setErr(null);

      // 1) Crear tarea en la API
      const res = await fetch(`${API_BASE_URL}/todos/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, done: false }),
      });
      if (!res.ok) throw new Error(`No se pudo añadir la tarea (${res.status})`);

      // 2) Recargar lista de tareas
      const reload = await fetch(`${API_BASE_URL}/users/${username}`);
      if (!reload.ok) throw new Error(`No se pudieron recargar las tareas (${reload.status})`);
      const data = await reload.json();
      setTodos(toArray(data));

      // 3) Limpiar input
      setLabel("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🗑️ Borrar una tarea concreta por su id
   *    - DELETE /todos/:todo_id
   *    - Luego recargar con GET /users/:username
   */
  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      setErr(null);

      // 1) Borrar tarea
      const res = await fetch(`${API_BASE_URL}/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`No se pudo borrar la tarea (${res.status})`);

      // 2) Recargar lista
      const reload = await fetch(`${API_BASE_URL}/users/${username}`);
      if (!reload.ok) throw new Error(`No se pudieron recargar las tareas (${reload.status})`);
      const data = await reload.json();
      setTodos(toArray(data));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🧯 Render de estados especiales
  if (err) return <div className="error">Error: {err}</div>;
  if (loading) return <div className="loading">Cargando…</div>;

  // 🖼️ Render principal
  return (
    <div className="wrap">
      <h1 className="title">Mis Tareas</h1>

      {/* Formulario para añadir nuevas tareas */}
      <form onSubmit={addTodo} className="form">
        <input
          type="text"
          className="input"
          placeholder="Nueva tarea…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="submit" className="btnAdd" disabled={!label.trim()}>
          Añadir
        </button>
      </form>

      {/* Lista de tareas */}
      <ul className="list">
        {todos.length === 0 && <li className="empty">No hay tareas aún</li>}

        {todos.map((t) => {
          // La API puede usar id, _id o todo_id según versión. Cubrimos todas.
          const id = t.id ?? t._id ?? t.todo_id;

          return (
            <li key={id ?? t.label} className="item">
              <span>{t.label}</span>

              {/* Botón X: aparece solo al pasar el ratón por el <li> (controlado por CSS) */}
              <button
                type="button"
                className="deleteBtn"
                aria-label={`Borrar ${t.label}`}
                onClick={() => deleteTodo(id)}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};