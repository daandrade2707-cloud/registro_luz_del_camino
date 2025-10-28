import React, { useState, useMemo } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwhv2NYe3Ze2DK00YhmXVVL_c6t2J3fMEsxX7mQ6NPB5QeIBvGC3tjn8inONVhXT9dP/exec";
    
  const PRODUCTOS = [
  { codigo: "011:Tortillas Asadas de Trigo", precio: 2 },
  { codigo: "012:Tortillas Asadas de Maiz", precio: 2.80},  
  { codigo: "021:Mazapanes 1un", precio: 1 },
  { codigo: "022:Mazapanes 18un", precio: 20 },
  { codigo: "031:Aguaymanto 1/2 kg", precio: 11 },
  { codigo: "032:Aguaymanto 1 kg", precio: 20 },
  { codigo: "033:Mermelada de Aguaymanto 1/16 kg", precio: 3 },
  { codigo: "033:Mermelada de Aguaymanto 1/4 kg", precio: 9 },
  { codigo: "034:Mermelada de Aguaymanto 1/2 kg", precio: 16},
  { codigo: "035:Mermelada de Aguaymanto 1 kg", precio: 30},
  { codigo: "041:Miel de Abeja 1/4 kg", precio: 15 },
  { codigo: "042:Miel de Abeja 1/2 kg", precio: 25 },
  { codigo: "043:Miel de Abeja 1 kg", precio: 40 },
  { codigo: "051:Algarrobina 1/4 kg", precio: 15 },
  { codigo: "052:Algarrobina 1/2 kg", precio: 22 },
  { codigo: "053:Algarrobina 1 kg", precio: 40 },
  { codigo: "061:Primera 1/2 litro", precio: 10 },
  { codigo: "062:Primera 1 litro", precio: 20 },
  { codigo: "071:Café 1/4 kg", precio: 16 },
  { codigo: "072:Café 1/2 kg", precio: 32 },
  { codigo: "073:Café 1 kg", precio: 64 },
  { codigo: "081:Manjar 1/8 kg", precio: 6 },
  { codigo: "082:Manjar 1/4 kg", precio: 10 },
  { codigo: "083:Manjar 1/2 kg", precio: 18 },
  { codigo: "084:Manjar 1 kg", precio: 32 },
  { codigo: "101:Queso 1/2 kg", precio: 17 },
  { codigo: "102:Queso 1 kg", precio: 30 },
  { codigo: "103:Queso Seco 1/4 kg", precio: 16},
  { codigo: "104:Queso Seco 1/2 kg", precio: 25},
  { codigo: "105:Queso Seco 1 kg", precio: 40},
  { codigo: "111:Harina de sango 1/2 kg", precio: 4.5 },
  { codigo: "112:Harina de sango 1 kg", precio: 8 },
  { codigo: "121:Harina de trigo 1/2 kg", precio: 7.5 },
  { codigo: "122:Harina de trigo 1 kg", precio: 14 },
  { codigo: "123:Miel de Caña 1/2 kg", precio: 10 },
  { codigo: "124:Miel de Caña 1 kg", precio: 18 },
  { codigo: "125:Tagelas", precio: 35},
  { codigo: "999:Delivery", precio: 0}
];

export default function AppRegistroPedidos() {
  const [cliente, setCliente] = useState({
    nombre: "",
    fechaEntrega: "",
    direccion: "",
    celular: "",
    contacto: "WPP",
    pago: "",
    estado: "0",
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
      const prod = PRODUCTOS.find(
        (p) => p.codigo.trim().toLowerCase() === value.trim().toLowerCase()
      );
      nuevos[i] = { ...nuevos[i], pedido: value, precio: prod ? prod.precio : "" };
    } else {
      // 🔹 Forzamos valores numéricos cuando corresponde
      const esNumero = ["cantidad", "precio", "descuento"].includes(name);
      nuevos[i][name] = esNumero ? Number(value || 0) : value;
    }

    setProductos(nuevos);
  };

  const agregarProducto = () =>
    setProductos([
      ...productos,
      { pedido: "", cantidad: "", precio: "", descuento: "" },
    ]);

  const eliminarProducto = (i) =>
    setProductos(productos.filter((_, idx) => idx !== i));

  // 🔹 Cálculo de totales y deuda
  const { total, totalDesc, debe } = useMemo(() => {
    const total = productos.reduce(
      (s, p) => s + Number(p.cantidad || 0) * Number(p.precio || 0),
      0
    );
    const totalDesc = productos.reduce(
      (s, p) =>
        s +
        (Number(p.cantidad || 0) * Number(p.precio || 0) -
          Number(p.descuento || 0)),
      0
    );
    // 🚨 CÁLCULO DE DEUDA: Total con descuento menos el pago
    const pago = parseFloat(cliente.pago) || 0;
    const debe = totalDesc - pago;
    return { total, totalDesc, debe };
  }, [productos, cliente.pago]); // Dependemos de productos y el pago

  // 🔹 Envío del pedido (modo no-cors para Netlify)
  const enviarPedido = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    // 🎯 PASO 2: Creamos el objeto final con los totales y la deuda calculada
    const clienteConDeuda = {
        ...cliente,
        total: total.toFixed(2),     // Total bruto
        totalDesc: totalDesc.toFixed(2), // Total con descuento
        debe: debe.toFixed(2),       // La deuda que faltaba
    };

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // 👉 Evita el error CORS en Netlify
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // 👉 Evita preflight OPTIONS
        body: JSON.stringify({ cliente: clienteConDeuda, productos }), // 🎯 Enviamos el objeto cliente modificado
      });

      setMensaje("✅ Pedido enviado correctamente. Verifica en Google Sheets 📄");
      setCliente({
        nombre: "",
        fechaEntrega: "",
        direccion: "",
        celular: "",
        contacto: "WPP",
        pago: "",
        estado: "0",
      });
      setProductos([{ pedido: "", cantidad: "", precio: "", descuento: "" }]);
    } catch (err) {
      console.error("Error al enviar:", err);
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
          <Input
            label="Nombre del Cliente *"
            name="nombre"
            value={cliente.nombre}
            onChange={handleClienteChange}
          />
          <Input
            label="Fecha de Entrega *"
            name="fechaEntrega"
            type="date"
            value={cliente.fechaEntrega}
            onChange={handleClienteChange}
          />
          <Input
            label="Dirección"
            name="direccion"
            value={cliente.direccion}
            onChange={handleClienteChange}
          />
          <Input
            label="Celular"
            name="celular"
            value={cliente.celular}
            onChange={handleClienteChange}
          />
          <Input
            label="Ubicación (URL de Google Maps)"
            name="mapa"
            value={cliente.mapa || ""}
            onChange={handleClienteChange}
            placeholder="https://maps.google.com/..."
          />
          <Input
            label="Pago (S/)"
            name="pago"
            type="number"
            value={cliente.pago}
            onChange={handleClienteChange}
          />
          
          <div>
            <label className="text-sm font-medium text-slate-600">
              Estado del Pedido
            </label>
            <select
              name="estado"
              value={cliente.estado}
              onChange={handleClienteChange}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="0">0: Por Entregar</option>
              <option value="1">1: Entregado</option>
            </select>
          </div>

          {/* Productos */}
          <div className="border-t pt-4">
            <h2 className="font-semibold text-emerald-700 mb-2">🛒 Productos</h2>
            {productos.map((p, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end mb-2">
                <div className="col-span-2">
                  <label className="text-sm text-slate-600">Producto</label>
                  <select
                    name="pedido"
                    value={p.pedido}
                    onChange={(e) => handleProductoChange(i, e)}
                    className="w-full border border-slate-300 rounded-xl px-2 py-1"
                  >
                    <option value="">-- Selecciona --</option>
                    {PRODUCTOS.map((prod) => (
                      <option key={prod.codigo} value={prod.codigo}>{prod.codigo}</option>
                    ))}
                  </select>
                </div>
                <InputCompact
                  label="Cant."
                  name="cantidad"
                  type="number"
                  value={p.cantidad}
                  onChange={(e) => handleProductoChange(i, e)}
                />
                <InputCompact
                  label="Precio"
                  name="precio"
                  type="number"
                  value={p.precio}
                  onChange={(e) => handleProductoChange(i, e)}
                />
                <InputCompact
                  label="Desc."
                  name="descuento"
                  type="number"
                  value={p.descuento}
                  onChange={(e) => handleProductoChange(i, e)}
                />
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => eliminarProducto(i)}
                    className="text-rose-500 text-xs font-semibold"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={agregarProducto}
              className="text-emerald-600 text-sm font-medium"
            >
              ➕ Agregar producto
            </button>
          </div>

          {/* Totales */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm mt-3 border border-slate-200">
            💰 <b>Total:</b> S/ {total.toFixed(2)} <br />
            💵 <b>Total con Descuento:</b> S/ {totalDesc.toFixed(2)} <br />
            🧾 <b>Debe:</b> S/{" "}
            {debe.toFixed(2)}
          </div>

          {/* Resumen */}
          {productos.length > 0 && (
            <div className="bg-emerald-50 p-3 mt-4 rounded-xl border border-emerald-200">
              <h3 className="font-bold text-emerald-700 mb-2">
                🧾 Resumen del Pedido
              </h3>
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
                      <td>
                        S/{" "}
                        {(
                          Number(p.cantidad || 0) * Number(p.precio || 0) -
                          Number(p.descuento || 0)
                        ).toFixed(2)}
                      </td>
                  </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">
                      Total con Descuento:
                    </td>
                    <td className="font-bold text-emerald-700">
                      S/ {totalDesc.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">
                      Pago:
                    </td>
                    <td>S/ {cliente.pago || 0}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-right font-semibold">
                      Debe:
                    </td>
                    <td className="font-bold text-rose-600">
                      S/ {debe.toFixed(2)}
                    </td>
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
            <div className="text-center mt-3 font-medium text-emerald-600">
              {mensaje}
            </div>
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
      <style>{`
        /* For Chrome, Safari, Edge, Opera */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* For Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
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
