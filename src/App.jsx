import React, { useState, useMemo } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz7PrQsa4LBeY6Y6pIRdagyWESJQkcifwvwGEVyRzedyxaM30gb1jCeSZ8O8nvcY0VQ/exec";

const PRODUCTOS = [
  { codigo: "01:Tortillas Asadas", precio: 2 },
  { codigo: "021:Mazapanes 18un", precio: 20 },
  { codigo: "041:Miel de Abeja 1/2 kg", precio: 25 },
  { codigo: "043:Miel de Abeja 1 kg", precio: 40 },
  { codigo: "052:Algarrobina 1/2 kg", precio: 22 },
  { codigo: "07:Café 1 kg", precio: 55 },
  { codigo: "101:Queso 1 kg", precio: 30 },
];

export default function AppRegistroPedidos() {
  const [cliente, setCliente] = useState({
    nombre: "",
    fechaEntrega: "",
    direccion: "",
    celular: "",
    contacto: "WPP",
    pago: "",
  });

  const [productos, setProductos] = useState([
    { pedido: "", cantidad: "", precio: "", descuento: "" },
  ]);

  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleClienteChange = (e) =>
    setCliente({ ...cliente, [e.target.name]: e.target.value });

  const handleProductoChange = (i, e) => {
    const nuevos = [...productos];
    const { name, value } = e.target;
    if (name === "pedido") {
      const prod = PRODUCTOS.find((p) => p.codigo === value);
      nuevos[i] = { ...nuevos[i], pedido: value, precio: prod ? prod.precio : "" };
    } else {
      nuevos[i][name] = value;
    }
    setProductos(nuevos);
  };

  const agregarProducto = () =>
    setProductos([...productos, { pedido: "", cantidad: "", precio: "", descuento: "" }]);

  const eliminarProducto = (i) =>
    setProductos(productos.filter((_, idx) => idx !== i));

  const { total, totalDesc } = useMemo(() => {
    const total = productos.reduce((s, p) => s + (p.cantidad || 0) * (p.precio || 0), 0);
    const totalDesc = productos.reduce(
      (s, p) => s + (p.cantidad || 0) * (p.precio || 0) - (p.descuento || 0),
      0
    );
    return { total, totalDesc };
  }, [productos]);

  const enviarPedido = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente, productos }),
        ...(isLocal ? { mode: "no-cors" } : {}),
      };

      const res = await fetch(SCRIPT_URL, fetchOptions);

      if (isLocal) {
        setMensaje("✅ Pedido enviado correctamente (modo local). Verifica en Sheets 📄");
      } else {
        const result = await res.json();
        if (result.ok) {
          setMensaje("✅ Pedido registrado correctamente en Google Sheets.");
          setCliente({
            nombre: "",
            fechaEntrega: "",
            direccion: "",
            celular: "",
            contacto: "WPP",
            pago: "",
          });
          setProductos([{ pedido: "", cantidad: "", precio: "", descuento: "" }]);
        } else throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al enviar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-center text-emerald-700 mb-4">
          📦 Registro de Pedido (Dinámico)
        </h1>

        <form onSubmit={enviarPedido} className="space-y-3">
          <Input label="Nombre del Cliente *" name="nombre" value={cliente.nombre} onChange={handleClienteChange} />
          <Input label="Fecha de Entrega *" name="fechaEntrega" type="date" value={cliente.fechaEntrega} onChange={handleClienteChange} />
          <Input label="Dirección" name="direccion" value={cliente.direccion} onChange={handleClienteChange} />
          <Input label="Celular" name="celular" value={cliente.celular} onChange={handleClienteChange} />
          <Input
                label="Ubicación (URL de Google Maps)"
                name="mapa"
                value={cliente.mapa || ""}
                onChange={handleClienteChange}
                placeholder="https://maps.google.com/..."
              />
          <Input label="Pago (S/)" name="pago" type="number" value={cliente.pago} onChange={handleClienteChange} />

          {/* Productos */}
          <div className="border-t pt-4">
            <h2 className="font-semibold text-emerald-700 mb-2">🛒 Productos</h2>
            {productos.map((p, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end mb-2">
                <div className="col-span-2">
                  <label className="text-sm text-slate-600">Producto</label>
                  <select name="pedido" value={p.pedido} onChange={(e) => handleProductoChange(i, e)} className="w-full border border-slate-300 rounded-xl px-2 py-1">
                    <option value="">-- Selecciona --</option>
                    {PRODUCTOS.map((prod) => (
                      <option key={prod.codigo}>{prod.codigo}</option>
                    ))}
                  </select>
                </div>
                <InputCompact label="Cant." name="cantidad" type="number" value={p.cantidad} onChange={(e) => handleProductoChange(i, e)} />
                <InputCompact label="Precio" name="precio" type="number" value={p.precio} onChange={(e) => handleProductoChange(i, e)} />
                <InputCompact label="Desc." name="descuento" type="number" value={p.descuento} onChange={(e) => handleProductoChange(i, e)} />
                {i > 0 && (
                  <button type="button" onClick={() => eliminarProducto(i)} className="text-rose-500 text-xs font-semibold">
                    ✖
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarProducto} className="text-emerald-600 text-sm font-medium">
              ➕ Agregar producto
            </button>
          </div>

          {/* Totales */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm mt-3 border border-slate-200">
            💰 <b>Total:</b> S/ {total.toFixed(2)} <br />
            💵 <b>Total con Descuento:</b> S/ {totalDesc.toFixed(2)} <br />
            🧾 <b>Debe:</b> S/ {(totalDesc - (parseFloat(cliente.pago) || 0)).toFixed(2)}
          </div>

          {/* Proforma previa */}
          {productos.length > 0 && (
            <div className="bg-emerald-50 p-3 mt-4 rounded-xl border border-emerald-200">
              <h3 className="font-bold text-emerald-700 mb-2">🧾 Resumen del Pedido</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td>{p.pedido}</td>
                      <td>{p.cantidad}</td>
                      <td>S/ {p.precio}</td>
                      <td>S/ {(p.cantidad * p.precio - p.descuento).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">Total con Descuento:</td>
                    <td className="font-bold text-emerald-700">S/ {totalDesc.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">Pago:</td>
                    <td>S/ {cliente.pago || 0}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">Debe:</td>
                    <td className="font-bold text-rose-600">S/ {(totalDesc - (parseFloat(cliente.pago) || 0)).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className={`w-full py-3 rounded-xl font-semibold ${
              enviando
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {enviando ? "Enviando..." : "Registrar Pedido"}
          </button>

          {mensaje && (
            <div className="text-center mt-3 font-medium text-emerald-600">{mensaje}</div>
          )}
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}

function InputCompact({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-slate-600">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}
