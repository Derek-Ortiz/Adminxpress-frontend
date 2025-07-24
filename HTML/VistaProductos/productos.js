// Variables globales
let currentCategory = 'all';
let selectedRow = null;
let selectedProductId = null;
let suppliesToAdd = []; 
let editSupplies = [];
let currentModal = 'add';
let products = []; 

// Obtener código de negocio del localStorage
function obtenerCodigoNegocio() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const codigoNegocio = userData?.codigo_negocio;

  

    if (!codigoNegocio) {
        alert("Error: No se encontró el código del negocio. Inicia sesión nuevamente.");
        window.location.href = "/Sesion.html"; 
        return null;
    }
    
    return codigoNegocio;
}

// Función para cargar productos desde el backend
async function cargarProductos() {
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;

    try {
        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos`);
        
        if (response.status === 401) {
            alert("La sesión ha expirado. Por favor inicie sesión nuevamente.");
            window.location.href = "/Sesion.html";
            return;
        }
        
        if (!response.ok) throw new Error('Error al cargar productos');
        
        products = await response.json();
        console.log("Productos cargados:", products);
        renderTable();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos: ' + error.message);
    }
}

// Funciones para selección de fila
function selectRow(row, productId) {
    // Remover selección previa
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(r => r.classList.remove('selected'));
    
    // Seleccionar nueva fila
    row.classList.add('selected');
    selectedRow = row;
    selectedProductId = productId;
    
    // Habilitar botones
    document.querySelector('.btn-edit').disabled = false;
    document.querySelector('.btn-delete').disabled = false;
}

// Funciones para abrir modales
async function openAddModal() {
    clearForm(); // Limpias el formulario primero (como ya lo haces)
    
    const insumos = await cargarInsumos();
    if (!insumos) return; // Si hubo error o no hay insumos, salir
    
    const supplySelect = document.getElementById('supplyName');
    
    // Limpiar dropdown
    supplySelect.innerHTML = '';
    
    // Opción por defecto
    const defaultOption = new Option(
        'Seleccione un insumo',
        '',
        true,
        true
    );
    supplySelect.add(defaultOption);
    
    // Llenar con insumos
    insumos.forEach(insumo => {
        const optionText = `${insumo.nombre} (${insumo.unidad})`;
        const option = new Option(optionText, insumo.id);
        option.dataset.unidad = insumo.unidad;
        supplySelect.add(option);
    });

    // Mostrar modal
    document.getElementById('addModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    currentModal = 'add';
}



async function cargarInsumos() {
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return null;

    try {
        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/insumosParaProductos`);
        if (!response.ok) {
            throw new Error(response.status === 404 
                ? 'No se encontraron insumos para este negocio' 
                : 'Error al cargar insumos');
        }
        const insumos = await response.json();
        return insumos;
    } catch (error) {
        console.error('Error al cargar insumos:', error);
        alert(error.message);
        return null;
    }
}



async function openEditModal() {
    if (!selectedProductId) return;

    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;



    try {
        // 1. Obtener datos del producto
        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}`);
        if (!response.ok) throw new Error('Error al obtener producto');
        const producto = await response.json();

        // 2. Llenar formulario con datos del producto
        document.getElementById('editName').value = producto.nombre;
        document.getElementById('editCategory').value = producto.tipo.toLowerCase();
        document.getElementById('editDescription').value = producto.descripcion;
        document.getElementById('editPrice').value = producto.precioActual;
        document.getElementById('editCostoProduccion').value = producto.costoProduccion;

        // 3. Obtener insumos del producto (los que ya tiene asignados)
        const insumosResponse = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}/insumos`);
        if (!insumosResponse.ok) throw new Error('Error al obtener insumos');
        editSupplies = await insumosResponse.json();
        renderSupplies('edit'); // Mostrar insumos actuales en el contenedor

        // 4. Cargar todos los insumos disponibles para llenar el <select> de insumos en edición
         document.getElementById('supplySubmitBtn').onclick = function() {
            if (currentModal === 'edit') {
                addEditSupply();
            } else {
                addSupply();
            }
        };
        
        const todosInsumos = await cargarInsumos();
        if (!todosInsumos) return;

        const supplySelect = document.getElementById('supplyName');
        supplySelect.innerHTML = ''; // Limpiar opciones previas

        // Opción por defecto
        const defaultOption = new Option('Seleccione un insumo', '', true, true);
        supplySelect.add(defaultOption);

        // Agregar opciones con todos los insumos disponibles
        todosInsumos.forEach(insumo => {
            const optionText = `${insumo.nombre} (${insumo.unidad})`;
            const option = new Option(optionText, insumo.id);
            option.dataset.unidad = insumo.unidad;
            supplySelect.add(option);
        });

        // 5. Mostrar modal de edición
        document.getElementById('editModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        currentModal = 'edit';

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar datos para edición: ' + error.message);
    }
}


function openDeleteModal() {
    document.getElementById('deleteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openSupplyModal(context = 'add') {
    document.getElementById('supplyModal').classList.add('active');
    currentModal = context;
    
    // Configurar el botón según el contexto
    const submitBtn = document.getElementById('supplySubmitBtn');
    if (context === 'edit') {
        submitBtn.textContent = 'Agregar a edición';
        submitBtn.onclick = addEditSupply;
    } else {
        submitBtn.textContent = 'Agregar';
        submitBtn.onclick = addSupply;
    }
    
    // Actualizar la unidad de medida cuando se selecciona un insumo
    document.getElementById('supplyName').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const unit = selectedOption.dataset.unidad || 'Unidad';
        document.getElementById('unitMeasure').textContent = unit;
    });
}

// Funciones para cerrar modales
function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    clearForm();
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    if (!selectedRow) {
        document.querySelector('.btn-edit').disabled = true;
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    if (!selectedRow) {
        document.querySelector('.btn-delete').disabled = true;
    }
}

function closeSupplyModal() {
    document.getElementById('supplyModal').classList.remove('active');
    document.getElementById('supplyForm').reset();
}

// Limpiar formulario
function clearForm() {
    document.getElementById('productForm').reset();
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.classList.remove('show'));
    suppliesToAdd = [];
    renderSupplies();
    
    // Limpiar preview de imagen
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '';
}

// Validación de formulario
async function validateForm(event) {
    event.preventDefault();
    
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;


        // Declara todas las variables primero
    const nombre = document.getElementById('productName').value.trim();
    const categoria = document.getElementById('productCategory').value;
    const descripcion = document.getElementById('productDescription').value.trim();
    const imagen = document.getElementById('productImage').files[0];
    const precio = document.getElementById('productPrice').value;
    const costoProduccion = document.getElementById('costoProduccion').value;
    
    let hasErrors = false;
    
    // Limpiar errores previos
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
    
    // Limpiar errores previos
    //const errorMessages = document.querySelectorAll('.error-message');
    //errorMessages.forEach(error => error.classList.remove('show'));
    
    // Validaciones (las que ya tenías)
        // Validaciones
    if (!nombre) {
        document.getElementById('nameError').classList.add('show');
        hasErrors = true;
    }
    
    if (!categoria) {
        document.getElementById('categoryError').classList.add('show');
        hasErrors = true;
    }
    
    if (!descripcion) {
        document.getElementById('descriptionError').classList.add('show');
        hasErrors = true;
    }
    
    if (imagen) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(imagen.type)) {
            document.getElementById('imageError').classList.add('show');
            hasErrors = true;
        }
    }
    
    if (suppliesToAdd.length === 0) {
        document.getElementById('suppliesError').classList.add('show');
        hasErrors = true;
    }
    
    if (!precio || isNaN(precio) || parseFloat(precio) < 0) {
        document.getElementById('priceError').classList.add('show');
        hasErrors = true;
    }

    if (!costoProduccion || isNaN(costoProduccion) || parseFloat(costoProduccion) < 0) {
        document.getElementById('costoError').classList.add('show');
        hasErrors = true;
    }

    if(parseFloat(costoProduccion) > parseFloat(precio)){
        document.getElementById('costoError').classList.add('show');
        hasErrors = true;
    }
    
    if (hasErrors) return;
    // ...

    try {
    // Crear FormData para enviar archivo + datos
    const formData = new FormData();
    
    // Agregar datos del producto como JSON
    const productData = {
        nombre: nombre,
        tipo: categoria,
        descripcion: descripcion,
        precioActual: parseFloat(precio),
        costoProduccion: parseFloat(costoProduccion),
        codigoNegocio: codigoNegocio
    };
    
    formData.append('producto', JSON.stringify(productData));
    
    // Agregar imagen si existe
    if (imagen) {
        formData.append('imagen', imagen);
    }


        console.log("📤 FormData que se va a enviar:");
        console.log("- Producto JSON:", JSON.stringify(productData));
        console.log("- Imagen:", imagen ? `${imagen.name} (${imagen.size} bytes)` : "Sin imagen");

        // Para ver el contenido completo del FormData:
         console.log("📤 FormData finaaal que se va a enviar:");
        for (let [key, value] of formData.entries()) {
            console.log(`- ${key}:`, value);
        }



        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            console.error("📥 Error completo del servidor:", errorData);
            throw new Error(errorData.detalle || errorData.error || errorData.message || 'Error al crear producto');
        }
        
        const productoGuardado = await response.json();
        
        // 2. Agregar los insumos (si hay)
        if (suppliesToAdd.length > 0) {
            for (const supply of suppliesToAdd) {
                await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${productoGuardado.id}/insumos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        codigoInsumo: supply.id_insumo,
                        cantidadUsar: supply.cantidad
                    })
                });
            }
        }
        
        alert('Producto creado exitosamente');
        closeAddModal();
        cargarProductos();
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}


// Funciones para manejar insumos
function addSupply() {
    const supplySelect = document.getElementById('supplyName');
    const selectedOption = supplySelect.options[supplySelect.selectedIndex];
    const quantity = parseFloat(document.getElementById('supplyQuantity').value);
    
    if (!selectedOption.value || isNaN(quantity) || quantity <= 0) {
        alert('Por favor seleccione un insumo e ingrese una cantidad válida');
        return;
    }
    
    const newSupply = {
        id_insumo: parseInt(selectedOption.value),
        nombre: selectedOption.text.split(' (')[0],
        cantidad: quantity,
        unidad_medida: selectedOption.dataset.unidad
    };
    
    // Verificar si el insumo ya fue agregado
    if (suppliesToAdd.some(s => s.id_insumo === newSupply.id_insumo)) {
        alert('Este insumo ya fue agregado');
        return;
    }
    
    suppliesToAdd.push(newSupply);
    renderSupplies();
    closeSupplyModal();
    document.getElementById('supplyForm').reset();
}

function renderSupplies(context = 'add') {
    const container = context === 'add' 
        ? document.getElementById('suppliesContainer')
        : document.getElementById('editSuppliesContainer');
        
    const supplyArray = context === 'add' ? suppliesToAdd : editSupplies;
    
    container.innerHTML = '';
    
    supplyArray.forEach((supply, index) => {
        const supplyElement = document.createElement('div');
        supplyElement.className = 'supply-item';
        supplyElement.innerHTML = `
            <span>${supply.nombre} - ${supply.cantidad}</span>
            <button onclick="removeSupply(${index}, '${context}')">
                <img src="/HTML/Imagenes/EliminarInsumo.png" alt="eliminar">
            </button>
        `;
        container.appendChild(supplyElement);
    });
}


// Función para agregar insumo en modo edición
function addEditSupply() {
    const supplySelect = document.getElementById('supplyName'); // ID corregido
    const selectedOption = supplySelect.options[supplySelect.selectedIndex];
    const quantity = parseFloat(document.getElementById('supplyQuantity').value); // ID corregido
    
    if (!selectedOption.value || isNaN(quantity) || quantity <= 0) {
        alert('Por favor seleccione un insumo e ingrese una cantidad válida');
        return;
    }
    
    const newSupply = {
        id_insumo: parseInt(selectedOption.value),
        nombre: selectedOption.text.split(' (')[0],
        cantidad: quantity,
        unidad_medida: selectedOption.dataset.unidad
    };
    
    // Verificar si el insumo ya fue agregado
    if (editSupplies.some(s => s.id_insumo === newSupply.id_insumo)) {
        alert('Este insumo ya fue agregado');
        return;
    }
    
    editSupplies.push(newSupply);
    renderSupplies('edit');
    closeSupplyModal();
    
    // Resetear el formulario de insumos
    document.getElementById('supplyForm').reset();
}

function removeSupply(index, context = 'add') {
    if (context === 'add') {
        suppliesToAdd.splice(index, 1);
        renderSupplies();
    } else {
        editSupplies.splice(index, 1);
        renderSupplies('edit');
    }
}

// Agregar insumos a un producto
async function agregarInsumosProducto(productoId, codigoNegocio) {
    try {
        const promises = suppliesToAdd.map(async supply => {
            const insumoData = {
                codigoInsumo: supply.id_insumo, // Asumiendo que el objeto supply tiene este campo
                cantidadUsar: supply.cantidad
            };
            
            const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${productoId}/insumos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(insumoData)
            });

            if (response.status === 401) {
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                throw new Error('Error al agregar insumo');
            }

            return response.json();
        });
        
        await Promise.all(promises);
    } catch (error) {
        if (error.message === 'Sesión expirada') {
            alert("La sesión ha expirado. Por favor inicie sesión nuevamente.");
            window.location.href = "/Sesion.html";
        } else {
            throw error;
        }
    }
}

// Guardar cambios en edición
async function saveChanges() {

    if (!selectedProductId) return;
    
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;
    
    const nombre = document.getElementById('editName').value.trim();
    const categoria = document.getElementById('editCategory').value;
    const descripcion = document.getElementById('editDescription').value.trim();
    const imagen = document.getElementById('editImage').files[0];
    const precio = document.getElementById('editPrice').value;
    const costoProduccion = document.getElementById('editCostoProduccion').value;
    
    // Validaciones básicas
    if (!nombre || !categoria || !descripcion || isNaN(precio) || isNaN(costoProduccion)) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
    // Crear FormData para manejar imagen y datos
    const formData = new FormData();
    
    const productoData = {
        nombre: nombre,
        tipo: categoria,
        descripcion: descripcion,
        precioActual: parseFloat(precio),
        costoProduccion: parseFloat(costoProduccion),
        codigoNegocio: codigoNegocio
    };

    formData.append('producto', JSON.stringify(productoData));
    
    // Agregar imagen si se seleccionó una nueva
    if (imagen) {
        formData.append('imagen', imagen);
    }

        console.log("📤 FormData que se va a enviar:");
        console.log("- Producto JSON:", JSON.stringify(productoData));
        console.log("- Imagen:", imagen ? `${imagen.name} (${imagen.size} bytes)` : "Sin imagen");


    console.log("➡ Datos final del producto a enviar:", productoData);

        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}`, {
            method: 'PUT',
            body: formData
        });

        if (response.status === 401) {
            alert("La sesión ha expirado. Por favor inicie sesión nuevamente.");
            window.location.href = "/Sesion.html";
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }

        // 2. Actualizar insumos
        if (editSupplies.length > 0) {
            console.log("➡ Actualizando insumos:", editSupplies);
            
            // Primero eliminar todos los insumos existentes
            await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}/insumos`, {
                method: 'DELETE'
            });
            
            // Luego agregar los nuevos insumos
            for (const supply of editSupplies) {
                const insumoData = {
                    codigoInsumo: supply.id_insumo,
                    cantidadUsar: supply.cantidad
                };
                
                const insumoResponse = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}/insumos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(insumoData)
                });
                
                if (!insumoResponse.ok) {
                    console.warn(`Error al agregar insumo ${supply.nombre}:`, await insumoResponse.text());
                }
            }
        }
        
        alert('Cambios guardados exitosamente');
        closeEditModal();
        cargarProductos();
        
    } catch (error) {
        console.error('Error completo:', error);
        alert('Error al actualizar producto: ' + error.message);
    }
}

// Confirmar eliminación
async function confirmDelete() {
    if (!selectedProductId) return;
    
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;
    
    try {
        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}`, {
            method: 'DELETE'
        });

        if (response.status === 401) {
            alert("La sesión ha expirado. Por favor inicie sesión nuevamente.");
            window.location.href = "/Sesion.html";
            return;
        }

        if (!response.ok) throw new Error('Error al eliminar producto');
        
        alert('Producto eliminado exitosamente');
        closeDeleteModal();
        cargarProductos();
        selectedRow = null;
        selectedProductId = null;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar producto: ' + error.message);
    }
}

// Renderizar tabla con productos
// Función renderTable corregida
function renderTable(category = 'all') {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(producto => {
            // Manejo seguro del tipo de producto
            const tipo = producto.tipo ? producto.tipo.toLowerCase() : '';
            return tipo === category;
        });
    
    filteredProducts.forEach(producto => {
        // Verificar que el producto tenga los datos necesarios
        if (!producto || !producto.nombre) return;
        
        const row = document.createElement('tr');
        row.onclick = () => selectRow(row, producto.id);

        // Manejo seguro de la imagen
        let imagenUrl = '/HTML/Imagenes/ejemplo.png'; // Imagen por defecto
        if (producto.imagen) {
            // Si la imagen viene como base64 o URL del servidor
            if (typeof producto.imagen === 'string') {
                if (producto.imagen.startsWith('data:')) {
                    imagenUrl = producto.imagen; // Base64
                } else if (producto.imagen.startsWith('uploads/')) {
                    // 
                    imagenUrl = `http://52.73.124.1:7000/${producto.imagen}`;
                } else {
                    // Por si acaso viene solo el nombre del archivo
                    imagenUrl = `http://52.73.124.1:7000/uploads/${producto.imagen}`;
                }
            } else if (producto.imagen.length > 0) {
                // Si viene como array de bytes
                try {
                    const blob = new Blob([new Uint8Array(producto.imagen)], {type: 'image/png'});
                    imagenUrl = URL.createObjectURL(blob);
                } catch (e) {
                    console.error('Error al procesar imagen:', e);
                }
            }
        }
        
        // Manejo seguro del precio
        let precioFormateado = '$0.00';
        if (producto.precioActual !== undefined && producto.precioActual !== null) {
            try {
                precioFormateado = '$' + parseFloat(producto.precioActual).toFixed(2);
            } catch (e) {
                console.error('Error al formatear precio:', e);
            }
        }
        
        // ✅ CAMBIO PRINCIPAL: Agregar la imagen al HTML
        row.innerHTML = `
            <td>${producto.nombre || 'Sin nombre'}</td>
            <td class="imagen-cell">
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}" 
                     class="producto-imagen"
                     onerror="this.src='/HTML/Imagenes/ejemplo.png'; this.onerror=null;"
                     onclick="ampliarImagen('${imagenUrl}', event)">
            </td>
            <td>${producto.descripcion || 'Sin descripción'}</td>
            <td>${precioFormateado}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ✅ Función para ampliar imagen (evita que se active selectRow)
function ampliarImagen(src, event) {
    // Detener la propagación para que no se active selectRow
    if (event) {
        event.stopPropagation();
    }
    
    // Crear modal si no existe
    if (!document.getElementById('imagenModal')) {
        const modal = document.createElement('div');
        modal.id = 'imagenModal';
        modal.className = 'imagen-modal';
        modal.innerHTML = `
            <span class="imagen-modal-close">&times;</span>
            <img class="imagen-modal-content" id="imagenAmpliada">
        `;
        document.body.appendChild(modal);
        
        // Cerrar modal al hacer clic
        modal.onclick = () => modal.style.display = 'none';
        document.querySelector('.imagen-modal-close').onclick = () => modal.style.display = 'none';
        
        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
    }
    
    // Mostrar imagen
    document.getElementById('imagenAmpliada').src = src;
    document.getElementById('imagenModal').style.display = 'block';
}


function handleImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}


// Event listeners para los botones de categoría
document.querySelectorAll('.category-btn').forEach((btn, index) => {
    const categories = ['snack', 'alimentos', 'bebidas'];
    btn.addEventListener('click', () => {
        // Remover clase active de todos los botones
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        // Añadir clase active al botón clickeado
        btn.classList.add('active');
        // Filtrar la tabla
        renderTable(categories[index]);
    });
});

// Cerrar modales al hacer clic fuera
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            if (modal.id === 'addModal') closeAddModal();
            if (modal.id === 'editModal') closeEditModal();
            if (modal.id === 'deleteModal') closeDeleteModal();
            if (modal.id === 'supplyModal') closeSupplyModal();
        }
    });
});

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

// Función de búsqueda de productos
function buscarProductosPorNombre() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderTable(currentCategory); // Mostrar todos según la categoría actual
        return;
    }

    // Filtrar productos por nombre, considerando también la categoría actual
    let productosFiltrados = products.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm)
    );

    // Si hay una categoría específica seleccionada, aplicar ese filtro también
    if (currentCategory !== 'all') {
        productosFiltrados = productosFiltrados.filter(producto => {
            const tipo = producto.tipo ? producto.tipo.toLowerCase() : '';
            return tipo === currentCategory;
        });
    }
    
    renderFilteredTable(productosFiltrados);
}

// Función para renderizar tabla filtrada (similar a renderTable pero recibe productos filtrados)
function renderFilteredTable(filteredProducts) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; color: #666; font-style: italic;">
                No se encontraron productos que coincidan con la búsqueda
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    filteredProducts.forEach(producto => {
        // Verificar que el producto tenga los datos necesarios
        if (!producto || !producto.nombre) return;
        
        const row = document.createElement('tr');
        row.onclick = () => selectRow(row, producto.id);
        
        // Manejo seguro del precio
        let precioFormateado = '$0.00';
        if (producto.precioActual !== undefined && producto.precioActual !== null) {
            try {
                precioFormateado = '$' + parseFloat(producto.precioActual).toFixed(2);
            } catch (e) {
                console.error('Error al formatear precio:', e);
            }
        }
        
        row.innerHTML = `
            <td>${producto.nombre || 'Sin nombre'}</td>
            <td></td>
            <td>${producto.descripcion || 'Sin descripción'}</td>
            <td>${precioFormateado}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Función para limpiar búsqueda
function limpiarBusqueda() {
    document.getElementById("searchInput").value = '';
    renderTable(currentCategory);
}

// Event listener actualizado para los botones de categoría
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    
    // Actualizar los event listeners de categorías para mantener el estado
    document.querySelectorAll('.category-btn').forEach((btn, index) => {
        const categories = ['snack', 'alimentos', 'bebidas'];
        btn.addEventListener('click', () => {
            // Actualizar categoría actual
            currentCategory = categories[index];
            
            // Remover clase active de todos los botones
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Añadir clase active al botón clickeado
            btn.classList.add('active');
            
            // Limpiar búsqueda y filtrar la tabla
            document.getElementById("searchInput").value = '';
            renderTable(currentCategory);
        });
    });
    
    
    // Event listener para el campo de búsqueda
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        // Búsqueda en tiempo real mientras escribes
        searchInput.addEventListener('input', buscarProductosPorNombre);
        
        // También búsqueda al presionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarProductosPorNombre();
            }
        });
    }
    
    // Event listener para botón de limpiar búsqueda (si existe)
    const clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) {
        clearBtn.addEventListener('click', limpiarBusqueda);
    }
});

