
let currentCategory = 'all';
let selectedRow = null;
let selectedProductId = null;
let suppliesToAdd = []; 
let editSupplies = [];
let currentModal = 'add';
let products = []; 

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
        console.log("Productos:", products);
        renderTable();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos: ' + error.message);
    }
}

function selectRow(row, productId) {
   
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(r => r.classList.remove('selected'));
    
   
    row.classList.add('selected');
    selectedRow = row;
    selectedProductId = productId;
    

    document.querySelector('.btn-edit').disabled = false;
    document.querySelector('.btn-delete').disabled = false;
}

async function openAddModal() {
    clearForm(); 
    
    const insumos = await cargarInsumos();
    if (!insumos) return; 
    
    const supplySelect = document.getElementById('supplyName');
   
    supplySelect.innerHTML = '';
 
    const defaultOption = new Option(
        'Seleccione un insumo',
        '',
        true,
        true
    );
    supplySelect.add(defaultOption);
    
    insumos.forEach(insumo => {
        const optionText = `${insumo.nombre} (${insumo.unidad})`;
        const option = new Option(optionText, insumo.id);
        option.dataset.unidad = insumo.unidad;
        supplySelect.add(option);
    });

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
      
        const response = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}`);
        if (!response.ok) throw new Error('Error al obtener producto');
        const producto = await response.json();

        document.getElementById('editName').value = producto.nombre;
        document.getElementById('editCategory').value = producto.tipo.toLowerCase();
        document.getElementById('editDescription').value = producto.descripcion;
        document.getElementById('editPrice').value = producto.precioActual;
        document.getElementById('editCostoProduccion').value = producto.costoProduccion;

        const insumosResponse = await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}/insumos`);
        if (!insumosResponse.ok) throw new Error('Error al obtener insumos');
        editSupplies = await insumosResponse.json();
        renderSupplies('edit'); 

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
        supplySelect.innerHTML = ''; 

        const defaultOption = new Option('Seleccione un insumo', '', true, true);
        supplySelect.add(defaultOption);

        todosInsumos.forEach(insumo => {
            const optionText = `${insumo.nombre} (${insumo.unidad})`;
            const option = new Option(optionText, insumo.id);
            option.dataset.unidad = insumo.unidad;
            supplySelect.add(option);
        });

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
    
    const submitBtn = document.getElementById('supplySubmitBtn');
    if (context === 'edit') {
        submitBtn.textContent = 'Agregar a edición';
        submitBtn.onclick = addEditSupply;
    } else {
        submitBtn.textContent = 'Agregar';
        submitBtn.onclick = addSupply;
    }
    
    document.getElementById('supplyName').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const unit = selectedOption.dataset.unidad || 'Unidad';
        document.getElementById('unitMeasure').textContent = unit;
    });
}

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

function clearForm() {
    document.getElementById('productForm').reset();
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.classList.remove('show'));
    suppliesToAdd = [];
    renderSupplies();
    
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '';
}

async function validateForm(event) {
    event.preventDefault();
    
    const codigoNegocio = obtenerCodigoNegocio();
    if (!codigoNegocio) return;

    const nombre = document.getElementById('productName').value.trim();
    const categoria = document.getElementById('productCategory').value;
    const descripcion = document.getElementById('productDescription').value.trim();
    const imagen = document.getElementById('productImage').files[0];
    const precio = document.getElementById('productPrice').value;
    const costoProduccion = document.getElementById('costoProduccion').value;
    
    let hasErrors = false;
    
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
    
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

    try {
  
    const formData = new FormData();
    
    const productData = {
        nombre: nombre,
        tipo: categoria,
        descripcion: descripcion,
        precioActual: parseFloat(precio),
        costoProduccion: parseFloat(costoProduccion),
        codigoNegocio: codigoNegocio
    };
    
    formData.append('producto', JSON.stringify(productData));
    
    if (imagen) {
        formData.append('imagen', imagen);
    }

        console.log("- Imagen:", imagen ? `${imagen.name} (${imagen.size} bytes)` : "Sin imagen");

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

function addEditSupply() {
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
    
    if (editSupplies.some(s => s.id_insumo === newSupply.id_insumo)) {
        alert('Este insumo ya fue agregado');
        return;
    }
    
    editSupplies.push(newSupply);
    renderSupplies('edit');
    closeSupplyModal();
    
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

async function agregarInsumosProducto(productoId, codigoNegocio) {
    try {
        const promises = suppliesToAdd.map(async supply => {
            const insumoData = {
                codigoInsumo: supply.id_insumo,
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
    
    if (!nombre || !categoria || !descripcion || isNaN(precio) || isNaN(costoProduccion)) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
   
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
    
    if (imagen) {
        formData.append('imagen', imagen);
    }

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

        if (editSupplies.length > 0) {
            console.log("➡ Actualizando insumos:", editSupplies);
            
            await fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/productos/${selectedProductId}/insumos`, {
                method: 'DELETE'
            });
            
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
        
        closeEditModal();
        cargarProductos();
        
    } catch (error) {
        console.error('Error completo:', error);
        alert('Error al actualizar producto: ' + error.message);
    }
}

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

function renderTable(category = 'all') {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(producto => {
            const tipo = producto.tipo ? producto.tipo.toLowerCase() : '';
            return tipo === category;
        });
    
    filteredProducts.forEach(producto => {
        if (!producto || !producto.nombre) return;
        
        const row = document.createElement('tr');
        row.onclick = () => selectRow(row, producto.id);

        let imagenUrl = '/HTML/Imagenes/ejemplo.png'; 
        if (producto.imagen) {
         
            if (typeof producto.imagen === 'string') {
                if (producto.imagen.startsWith('data:')) {
                    imagenUrl = producto.imagen; 
                } else if (producto.imagen.startsWith('uploads/')) {
                    
                    imagenUrl = `http://52.73.124.1:7000/${producto.imagen}`;
                } else {
                 
                    imagenUrl = `http://52.73.124.1:7000/uploads/${producto.imagen}`;
                }
            } else if (producto.imagen.length > 0) {
                try {
                    const blob = new Blob([new Uint8Array(producto.imagen)], {type: 'image/png'});
                    imagenUrl = URL.createObjectURL(blob);
                } catch (e) {
                    console.error('Error al procesar imagen:', e);
                }
            }
        }
        
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

function ampliarImagen(src, event) {
   
    if (event) {
        event.stopPropagation();
    }
    if (!document.getElementById('imagenModal')) {
        const modal = document.createElement('div');
        modal.id = 'imagenModal';
        modal.className = 'imagen-modal';
        modal.innerHTML = `
            <span class="imagen-modal-close">&times;</span>
            <img class="imagen-modal-content" id="imagenAmpliada">
        `;
        document.body.appendChild(modal);
        
        modal.onclick = () => modal.style.display = 'none';
        document.querySelector('.imagen-modal-close').onclick = () => modal.style.display = 'none';
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        });
    }
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

document.querySelectorAll('.category-btn').forEach((btn, index) => {
    const categories = ['snack', 'alimentos', 'bebidas'];
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable(categories[index]);
    });
});

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

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

function buscarProductosPorNombre() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderTable(currentCategory); 
        return;
    }

    let productosFiltrados = products.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm)
    );

    if (currentCategory !== 'all') {
        productosFiltrados = productosFiltrados.filter(producto => {
            const tipo = producto.tipo ? producto.tipo.toLowerCase() : '';
            return tipo === currentCategory;
        });
    }
    renderFilteredTable(productosFiltrados);
}

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
        
        if (!producto || !producto.nombre) return;
        
        const row = document.createElement('tr');
        row.onclick = () => selectRow(row, producto.id);
        
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

function limpiarBusqueda() {
    document.getElementById("searchInput").value = '';
    renderTable(currentCategory);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    
    document.querySelectorAll('.category-btn').forEach((btn, index) => {
        const categories = ['snack', 'alimentos', 'bebidas'];
        btn.addEventListener('click', () => {
           
            currentCategory = categories[index];
            
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById("searchInput").value = '';
            renderTable(currentCategory);
        });
    });
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener('input', buscarProductosPorNombre);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarProductosPorNombre();
            }
        });
    }
});

