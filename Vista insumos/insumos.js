
const API_BASE = "http://52.73.124.1:7000/api";

const userData = JSON.parse(localStorage.getItem('userData'));
const codigoNegocio = userData?.codigo_negocio;


if (!codigoNegocio) {
    alert("Error: No se encontró el código del negocio, por favor inicia sesión nuevamente.");
    window.location.href = "/Sesion.html"; 
}




// Cargar insumos al iniciar
document.addEventListener("DOMContentLoaded", listarInsumos);

// LISTAR insumos por negocio
// Añade esto al inicio, después de codigoNegocio
let todosLosInsumos = []; // Almacenará todos los insumos para búsquedas locales

// Modifica tu función listarInsumos para guardar los datos
function listarInsumos() {
  fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos`)
    .then(res => res.json())
    .then(data => {
      todosLosInsumos = data; // Guardamos todos los insumos
      mostrarInsumos(data);   // Mostramos todos inicialmente
    })
    .catch(err => console.error("Error al listar los insumos:", err));
}

// Función auxiliar para mostrar insumos en la tabla
function mostrarInsumos(insumos) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  insumos.forEach(insumo => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${insumo.id}</td>
      <td>${insumo.nombre}</td>
      <td>${insumo.stock}</td>
      <td>${insumo.unidad}</td>
      <td>${formatCaducidad(insumo.caducidad)}</td>
      <td>$${parseFloat(insumo.precio || 0).toFixed(2)}</td>
      <td class="status"><div class="dot ${colorPorEstado(insumo.estado)}"></div>${insumo.estado}</td>
    `;
    tr.addEventListener("click", () => seleccionarFila(tr, insumo));
    tbody.appendChild(tr);
  });
}

// Función de búsqueda
function buscarInsumosPorNombre() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
  
  if (!searchTerm) {
    mostrarInsumos(todosLosInsumos); // Mostrar todos si no hay término de búsqueda
    return;
  }

  const insumosFiltrados = todosLosInsumos.filter(insumo => 
    insumo.nombre.toLowerCase().includes(searchTerm)
  );
  
  mostrarInsumos(insumosFiltrados);
}


function formatCaducidad(caducidad) {
  if (!caducidad) return "No aplica"; // 
  return caducidad; // 
}

function colorPorEstado(estado) {
  switch (estado) {
    case "Sin stock": return "red";
    case "Bajo stock": return "orange";
    case "Ok": return "green";
    default: return "";
  }
}


// SELECCIÓN de fila
let insumoSeleccionado = null;
function seleccionarFila(fila, insumo) {
  document.querySelectorAll("tbody tr").forEach(r => r.classList.remove("selected"));
  fila.classList.add("selected");
  insumoSeleccionado = insumo;
  
  document.getElementById("btnEdit").disabled = false;
  document.getElementById("btnDelete").disabled = false;
  document.getElementById("btnUpdate").disabled = false;
  document.getElementById("btnHistorial").disabled = false;

  document.getElementById("editNombre").value = insumo.nombre;
  document.getElementById("editUnidad").value = insumo.unidad;
  document.getElementById("editPrecio").value = insumo.precio || 0;
  document.getElementById("editStock").value = insumo.stock;
  document.getElementById("editStock-minimo").value = insumo.minStock;
  document.getElementById("editCaducidad").value = insumo.caducidad || "2025-12-31";

  document.getElementById("itemAEliminar").textContent = insumo.nombre;
}

// AGREGAR insumo
function agregarItem() {

  let caducidad = document.getElementById("addCaducidad").value;
  
  if (!caducidad) {
    caducidad = null; 
  }
  

  const nuevoInsumo = {
    nombre: document.getElementById("addNombre").value,
    unidad: document.getElementById("addUnidad").value,
    precio: parseFloat(document.getElementById("addPrecio").value),
    stock: parseInt(document.getElementById("addStock").value),
    minStock: parseInt(document.getElementById("addStock-minimo").value),
    caducidad: caducidad,
    estado: calcularEstado(
        parseInt(document.getElementById("addStock").value),
        parseInt(document.getElementById("addStock-minimo").value)
      ),
    idNegocio: parseInt(codigoNegocio)
  };
  

  fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos`, {  
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoInsumo)
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al agregar insumo");
    return res.json();
  })
  .then(() => {
    listarInsumos();
    closeModal("addModal");
  })
  .catch(err => showError(err.message));
}

// Función para mostrar errores
function showError(message) {
  const errorModal = document.getElementById("errorModal");
  const errorMessage = document.getElementById("errorMessage");
  
  errorMessage.textContent = message;
  errorModal.style.display = 'block';
  
  // Configurar el botón de cierre
  const closeBtn = errorModal.querySelector(".close, .btn-cancel");
  closeBtn.onclick = function() {
    errorModal.style.display = 'none';
  };
}


// EDITAR insumo
function editarItem() {
  if (!insumoSeleccionado) return;

  const actualizado = {
    nombre: document.getElementById("editNombre").value,
    unidad: document.getElementById("editUnidad").value,
    precio: parseFloat(document.getElementById("editPrecio").value),
    stock: parseInt(document.getElementById("editStock").value),
    minStock: parseInt(document.getElementById("editStock-minimo").value),
    caducidad: document.getElementById("editCaducidad").value,
    estado: calcularEstado(
      parseInt(document.getElementById("editStock").value),
      parseInt(document.getElementById("editStock-minimo").value)
    ),
    idNegocio: parseInt(codigoNegocio)
  };

  fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos/${insumoSeleccionado.id}`, {  
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(actualizado)
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al actualizar insumo");
    return res.json();
  })
  .then(() => {
    listarInsumos();
    closeModal("editModal");
  })
  .catch(err => showError(err.message));
}



// Función para abrir el modal de historial
function openHistorialModal() {
  if (!insumoSeleccionado) return;
  
  document.getElementById("historialTitulo").textContent = insumoSeleccionado.nombre;
  
  fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos/${insumoSeleccionado.id}/historial`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("historialBody");
      tbody.innerHTML = "";
      
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay registros de historial</td></tr>';
        return;
      }
      
      data.forEach(registro => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatFecha(registro.fecha)}</td>
          <td>${registro.stock > 0 ? '+' : ''}${registro.cantidad}</td>
          <td>$${parseFloat(registro.precio || 0).toFixed(4)}</td>
          <td>${formatCaducidad(registro.caducidad)}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Error al obtener el historial:", err);
      showError("Error al cargar el historial");
    });
  
  openModal("historialModal");
}

function formatFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString();
}

function formatCaducidad(fechaStr) {
  return fechaStr ? new Date(fechaStr).toLocaleDateString() : "Sin fecha";
}


// Función para actualizar stock (modificada para tu estructura)
function actualizarStock() {
  try {
    // 1. Verificar que hay un insumo seleccionado
    if (!insumoSeleccionado) {
      throw new Error("Por favor seleccione un insumo primero");
    }

    // 2. Obtener referencias a los elementos del formulario
    const stockInput = document.getElementById("updateStock");
    const precioInput = document.getElementById("updatePrecio");
    const caducidadInput = document.getElementById("updateCaducidad");

    // 3. Verificar que los elementos existen
    if (!stockInput || !precioInput || !caducidadInput) {
      throw new Error("Error en el formulario: faltan campos requeridos");
    }

    // 4. Obtener y validar los valores
    const nuevoStock = parseFloat(stockInput.value);
    const precio = parseFloat(precioInput.value);
    const caducidad = caducidadInput.value || null;

    if (isNaN(nuevoStock)) {
      throw new Error("El stock debe ser un número válido");
    }

    if (isNaN(precio) || precio <= 0) {
      throw new Error("El precio debe ser un número positivo mayor que cero");
    
    }

    // 5. Preparar los datos para enviar al servidor
    const datosActualizacion = {
      stock: nuevoStock,
      precio: precio,
      caducidad: caducidad,
      idNegocio: parseInt(codigoNegocio)
    };


    // 6. Enviar la actualización al servidor
    fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos/${insumoSeleccionado.id}/movimiento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosActualizacion)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { 
          throw new Error(err.message || "Error al actualizar el stock"); 
        });
      }
      return response.json();
    })
    .then(data => {
      // 7. Actualizar la lista y cerrar el modal
      listarInsumos();
      closeModal("updateModal");
      alert("Stock actualizado correctamente");
    })
    .catch(error => {
      console.error("Error al actualizar stock:", error);
      showError(error.message);
    });

  } catch (error) {
    console.error("Error en actualizarStock:", error);
    showError(error.message);
  }
}




// ELIMINAR insumo 
function eliminarItem() {
  if (!insumoSeleccionado) return;

  fetch(`${API_BASE}/negocio/${codigoNegocio}/insumos/${insumoSeleccionado.id}`, {  
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al eliminar insumo");
    listarInsumos();
    closeModal("deleteModal");
    document.getElementById("btnEdit").disabled = true;
    document.getElementById("btnDelete").disabled = true;
  })
  .catch(err => showError(err.message));
}

// Calcula estado según stock
function calcularEstado(stock, minStock) {
  if (stock <= 0) {
    return "Sin stock";
  } else if (stock < minStock) {
    return "Bajo stock";
  } else {
    return "Ok";
  }
}

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

// Cerrar modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function validarFormulario(modalId) {
  if (modalId === 'addModal') {
    const nombre = document.getElementById("addNombre").value.trim();
    const unidad = document.getElementById("addUnidad").value.trim();
    const precio = document.getElementById("addPrecio").value;
    const stock = document.getElementById("addStock").value;
    const minStock = document.getElementById("addStock-minimo").value;  
    
    const errorNombre = document.getElementById('error-nombre');  
    const errorUnidad = document.getElementById('error-unidad');  
    const errorPrecio = document.getElementById('error-precio');  
    const errorStock = document.getElementById('error-stock'); 
    const errorStockM = document.getElementById('error-stockM'); 

    if (!nombre) {
      errorNombre.style.display = 'inline';
      return;
    }

    if ( !unidad ) {
      errorUnidad.style.display = 'inline';
      return;
    }

     if (precio === "") {
      errorPrecio.style.display = 'inline';
      return;
    }

     if ( stock === "") {
      errorStock.style.display = 'inline';
      return;
    }

     if ( minStock === "") {
      errorStockM.style.display = 'inline';
      return;
    }

    if (isNaN(precio) || isNaN(stock) || isNaN(minStock)) {
      alert("Precio y stock deben ser valores numéricos.");
      return;
    }

    agregarItem(); 
  }

  if (modalId === 'editModal') {
    editarItem(); 
  }
}



