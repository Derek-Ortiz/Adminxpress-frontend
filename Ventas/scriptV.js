document.addEventListener('DOMContentLoaded', function () {
   
    let ordenesPendientes = [];
    let ordenesCompletadas = [];
    let ordenActual = null;
    let productos = [];
    let ventaSeleccionada = null;
    let ventasRealizadas = [];
    
    const API_BASE_URL = 'http://52.73.124.1:7000/api';
    const userData = JSON.parse(localStorage.getItem('userData'));
    const codigoNegocio = userData?.codigo_negocio;
    const ID_USUARIO = userData?.id_empleado;

    if (!codigoNegocio) {
        alert("Error: No se encontró el código del negocio, por favor inicia sesión nuevamente.");
        window.location.href = "/Sesion.html"; 
    }

    const seccionCatalogo = document.querySelector('.seccion-catalogo');
    const seccionDetallesOrden = document.querySelector('.detalles-orden');
    const ventanaOrdenes = document.querySelector('.ventana-ordenes');
    const listaProductos = document.getElementById('lista-productos');
    const totalPrecio = document.getElementById('total-precio');
    const botonesCategoria = document.querySelectorAll('.buttons-categoria');
    const contenidoOrdenes = document.querySelector('.ventana-ordenes .contenido');

    mostrarVentanaOrdenes();
    cargarProductosDesdeAPI();
    cargarPedidosPendientes(); 

    botonesCategoria.forEach(boton => {
        boton.addEventListener('click', function () {
            const categoria = this.querySelector('.nombre-categoria').textContent;
            cargarProductos(categoria);
        });
    });

    document.querySelector('.cerrar-historial-btn').addEventListener('click', function() {
        document.getElementById('modalHistorial').style.display = 'none';
    });

    async function cargarPedidosPendientes() {
        try {
            mostrarCargando(true);
            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            let pedidos = [];
            
            if (Array.isArray(data)) {
                pedidos = data;
            } else if (data && Array.isArray(data.pedidos)) {
                pedidos = data.pedidos;
            } else if (data && Array.isArray(data.data)) {
                pedidos = data.data;
            } else if (data && data.success && Array.isArray(data.result)) {
                pedidos = data.result;
            } else {
                pedidos = [];
            }
            
            if (pedidos.length === 0) {
                
                ordenesPendientes = [];
                actualizarVentanaOrdenes();
                return;
            }
            const pedidosPendientes = pedidos.filter(pedido => {
                
                return pedido && pedido.estado === false;
            });
            ordenesPendientes = pedidosPendientes.map(pedido => {
                
                let productosOrden = [];
                if (pedido.detalles && Array.isArray(pedido.detalles)) {
                    productosOrden = pedido.detalles.map(detalle => {
                        const producto = productos.find(p => p.id === detalle.codigoProducto);
                        return {
                            id: detalle.codigoProducto,
                            nombre: producto ? producto.nombre : `Producto ${detalle.codigoProducto}`,
                            precio: producto ? producto.precio : 0,
                            cantidad: detalle.cantidad || 1,
                            subtotal: (producto ? producto.precio : 0) * (detalle.cantidad || 1)
                        };
                    });
                }
                
                return {
                    id: `ORD${pedido.idOrden || pedido.id}`,
                    idServidor: pedido.idOrden || pedido.id,
                    fecha: new Date(pedido.fechaCreacion || pedido.fecha || Date.now()),
                    productos: productosOrden,
                    total: pedido.total || 0,
                    estado: 'pendiente',
                    estadoBD: false, 
                    idServidor: pedido.idOrden || pedido.id
                };
            });

            ordenesPendientes.forEach(orden => {
                if (orden.productos && orden.productos.length > 0) {
                    orden.total = orden.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
                }
            });
            
            actualizarVentanaOrdenes();
            
        } catch (error) {
            console.error('Error al cargar pedidos pendientes:', error);
            mostrarError('Error al cargar pedidos pendientes: ' + error.message);
            ordenesPendientes = [];
            actualizarVentanaOrdenes();
        } finally {
            mostrarCargando(false);
        }
    }

    async function cargarVentasDesdeAPI() {
        try {
            mostrarCargando(true);
            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/ventas`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            
            let ventas = [];
            
            if (Array.isArray(data)) {
                ventas = data;
            } else if (data && Array.isArray(data.ventas)) {
                
                ventas = data.ventas;
            } else if (data && Array.isArray(data.data)) {
               
                ventas = data.data;
            } else if (data && data.success && Array.isArray(data.result)) {
               
                ventas = data.result;
            } else {
                ventas = [];
            }

            if (ventas.length === 0) {
                ordenesCompletadas = [];
                return [];
            }
            
            ordenesCompletadas = ventas.map(venta => {
                let productosVenta = [];
                if (venta.detalles && Array.isArray(venta.detalles)) {
                    productosVenta = venta.detalles.map(detalle => {
                        const producto = productos.find(p => p.id === detalle.codigoProducto);
                        return {
                            id: detalle.codigoProducto,
                            nombre: producto ? producto.nombre : `Producto ${detalle.codigoProducto}`,
                            precio: producto ? producto.precio : 0,
                            cantidad: detalle.cantidad || 1,
                            subtotal: (producto ? producto.precio : 0) * (detalle.cantidad || 1)
                        };
                    });
                }
                
                return {
                    id: `ORD${venta.idOrden || venta.id}`,
                    idServidor: venta.idOrden || venta.id,
                    fecha: new Date(venta.fechaCreacion || venta.fecha || Date.now()),
                    fechaCompletada: new Date(venta.fechaActualizacion || venta.fechaCompletada || venta.fechaCreacion || venta.fecha || Date.now()),
                    productos: productosVenta,
                    total: venta.total || 0,
                    estado: 'completada',
                    estadoBD: true
                };
            });
            
            console.log('Órdenes completadas:', ordenesCompletadas);
            return ventas;
            
        } catch (error) {
            console.error('Error al cargar ventas:', error);
            ordenesCompletadas = [];
            throw error;
        } finally {
            mostrarCargando(false);
        }
    }

    async function cargarProductosDesdeAPI() {
        try {
            mostrarCargando(true);
            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/productosVentas`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            productos = data.map(producto => ({
                id: producto.id || producto.codigo || producto.idProducto,
                nombre: producto.nombre,
                precio: producto.precioActual || producto.precio,
                categoria: producto.tipo || producto.categoria || 'ALIMENTOS',
                descripcion: producto.descripcion || producto.nombre,

                imagenUrl: producto.imagen != null 
                ? `http://52.73.124.1:7000/${producto.imagen}` 
                : "/Ventas/iconos/ejemplo.png"
            }));

            
            console.log('Productos cargados:', productos);
            
            await cargarPedidosPendientes();
            
            const categoriasDisponibles = [...new Set(productos.map(p => p.categoria))];
            if (categoriasDisponibles.length > 0) {
                cargarProductos(categoriasDisponibles[0]);
            }
            
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarError('Error al cargar productos: ' + error.message);
        } finally {
            mostrarCargando(false);
        }
    }

    function cargarProductos(categoria) {
        const catalogo = document.querySelector('.catalogo');
        catalogo.innerHTML = '';

        const productosFiltrados = productos.filter(p => 
            p.categoria.toUpperCase() === categoria.toUpperCase()
        );

        if (productosFiltrados.length === 0) {
            catalogo.innerHTML = '<p>No hay productos en esta categoría</p>';
            return;
        }

        productosFiltrados.forEach(producto => {
            const productoElement = document.createElement('div');
            productoElement.className = 'producto';
            productoElement.innerHTML = `
                <img src="${producto.imagenUrl}" alt="${producto.nombre}" />
                <h4>Nombre: ${producto.nombre} $${producto.precio.toFixed(2)}</h4>
                <p>Descripción: ${producto.descripcion}</p>
                <button class="btn-anadir" data-id="${producto.id}">Añadir</button>
            `;
            catalogo.appendChild(productoElement);
        });

        document.querySelectorAll('.btn-anadir').forEach(btn => {
            btn.addEventListener('click', function () {
                const productoId = parseInt(this.getAttribute('data-id'));
                const producto = productos.find(p => p.id === productoId);
                agregarProductoAOrden(producto);
            });
        });
    }

    async function crearPedidoEnBD(orden) {
        try {
            const ordenParaEnviar = {
                idUsuarioRealiza: ID_USUARIO,
                estado: false, // false = pendiente/en proceso
                detalles: orden.productos.map(producto => ({
                    codigoProducto: producto.id,
                    cantidad: producto.cantidad
                }))
            };

            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ordenParaEnviar)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();
            orden.idServidor = resultado.idOrden;
            orden.estadoBD = false; 
            
            return resultado;

        } catch (error) {
            console.error('Error al crear pedido en BD:', error);
            throw error;
        }
    }

    async function actualizarPedidoEnBD(orden) {
        try {
            const ordenParaEnviar = {
                idUsuarioRealiza: ID_USUARIO,
                estado: false, 
                detalles: orden.productos.map(producto => ({
                    codigoProducto: producto.id,
                    cantidad: producto.cantidad
                }))
            };

            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos/${orden.idServidor}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ordenParaEnviar)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();
            
            return resultado;

        } catch (error) {
            console.error('Error al actualizar pedido en BD:', error);
        }
    }

    async function guardarOrdenEnBD() {
        if (!ordenActual || ordenActual.productos.length === 0) {
            return;
        }

        try {
            if (ordenActual.idServidor) {
                await actualizarPedidoEnBD(ordenActual);
            } else {
                await crearPedidoEnBD(ordenActual);
            }
        } catch (error) {
            console.error('Error al guardar en BD:', error);
        }
    }

    function agregarProductoAOrden(producto) {
        if (!ordenActual) {
            ordenActual = {
                id: generarIdOrden(),     
                idUsuarioRealiza: ID_USUARIO,
                idUsuarioCV: null,
                fecha: new Date(),
                productos: [],
                total: 0,
                estado: 'pendiente',
                estadoBD: null, 
                idServidor: null 
            };
            ordenesPendientes.push(ordenActual);
            mostrarDetallesOrden();
            actualizarVentanaOrdenes();
        }

        const productoExistente = ordenActual.productos.find(p => p.id === producto.id);

        if (productoExistente) {
            productoExistente.cantidad += 1;
            productoExistente.subtotal = productoExistente.cantidad * producto.precio;
        } else {
            ordenActual.productos.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                subtotal: producto.precio
            });
        }

        ordenActual.total = ordenActual.productos.reduce((sum, p) => sum + p.subtotal, 0);
        actualizarDetallesOrden();
        
        guardarOrdenEnBD();
    }

    function mostrarDetallesOrden() {
        ventanaOrdenes.style.display = 'none';
        seccionDetallesOrden.style.display = 'block';
        seccionDetallesOrden.style.display = 'block';

        const detallesHeader = document.querySelector('.detalles-header div');
        const estadoBDText = ordenActual.idServidor ? ' (Guardado en BD)' : ' (No guardado)';
        detallesHeader.innerHTML = `
            <h3>Detalles orden ${ordenActual.id}${estadoBDText}</h3>
            <div class="fecha-hora">${formatearFecha(ordenActual.fecha)} 🕐 ${formatearHora(ordenActual.fecha)}</div>
        `;

         actualizarDetallesOrden();
    }

    function actualizarDetallesOrden() {
        listaProductos.innerHTML = '';


        ordenActual.productos.forEach(producto => {
            const item = document.createElement('div');
            item.className = 'item-producto';
            item.setAttribute('data-id', producto.id);
            item.innerHTML = `
                <div class="info-producto">
                    <div class="nombre-producto">${producto.nombre}</div>
                    <div class="precio-producto">$${producto.precio.toFixed(2)}</div>
                </div>
                <div class="controles-cantidad">
                    <button class="btn-cantidad" data-action="decrement" data-id="${producto.id}">-</button>
                    <span class="cantidad">${producto.cantidad.toString().padStart(2, '0')}</span>
                    <button class="btn-cantidad" data-action="increment" data-id="${producto.id}">+</button>
                    <button class="eliminar-btn" data-id="${producto.id}">🗑️</button>
                </div>
            `;
            listaProductos.appendChild(item);
        });

        totalPrecio.textContent = `$${ordenActual.total.toFixed(2)}`;

        document.querySelectorAll('.btn-cantidad').forEach(btn => {
            btn.addEventListener('click', function () {
                const productoId = parseInt(this.getAttribute('data-id'));
                const action = this.getAttribute('data-action');
                cambiarCantidad(productoId, action === 'increment' ? 1 : -1);
            });
        });

        document.querySelectorAll('.eliminar-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const productoId = parseInt(this.getAttribute('data-id'));
                eliminarProducto(productoId);
            });
        });
    }

    function cambiarCantidad(productoId, cambio) {
        const producto = ordenActual.productos.find(p => p.id === productoId);
        if (!producto) return;

        producto.cantidad += cambio;
        if (producto.cantidad <= 0) {
            eliminarProducto(productoId);
            return;
        }

        producto.subtotal = producto.cantidad * producto.precio;
        ordenActual.total = ordenActual.productos.reduce((sum, p) => sum + p.subtotal, 0);
        actualizarDetallesOrden();
        
        guardarOrdenEnBD();
    }

    function eliminarProducto(productoId) {
        ordenActual.productos = ordenActual.productos.filter(p => p.id !== productoId);
        if (ordenActual.productos.length === 0) {
            cancelarOrden();
            return;
        }

        ordenActual.total = ordenActual.productos.reduce((sum, p) => sum + p.subtotal, 0);
        actualizarDetallesOrden();
        guardarOrdenEnBD();
    }

    function mostrarVentanaOrdenes() {
        seccionDetallesOrden.style.display = 'none';
        ventanaOrdenes.style.display = 'block';
        actualizarVentanaOrdenes();
    }

    function actualizarVentanaOrdenes() {
        contenidoOrdenes.innerHTML = '';
        if (ordenesPendientes.length === 0) {
            contenidoOrdenes.innerHTML = '<p>No hay órdenes pendientes</p>';
            return;
        }

        ordenesPendientes.forEach(orden => {
            const ordenItem = document.createElement('div');
            ordenItem.className = 'orden-item';
            if (ordenActual && orden.id === ordenActual.id) {
                ordenItem.classList.add('orden-actual');
            }
          
            const estadoBD = orden.idServidor ? 'guardado' : 'pendiente';
            ordenItem.innerHTML = `
                <div class="orden-codigo">${orden.id} ${estadoBD}</div>
                <div class="orden-info">
                    <div class="orden-fecha">${formatearFechaCorta(orden.fecha)}</div>
                    <div class="orden-hora">${formatearHora(orden.fecha)}</div>
                </div>
            `;
            ordenItem.addEventListener('click', () => {
                ordenActual = orden;
                mostrarDetallesOrden();
            });
            contenidoOrdenes.appendChild(ordenItem);
        });
    }

    function agregarOrden() {
        ordenActual = {
            id: generarIdOrden(),
            fecha: new Date(),
            productos: [],
            total: 0,
            estado: 'pendiente',
            estadoBD: null,
            idServidor: null
        };
        ordenesPendientes.push(ordenActual);
        mostrarDetallesOrden();
        actualizarVentanaOrdenes();
    }

    async function eliminarPedidoDeBD(idServidor) {
        try {
            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos/${idServidor}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            } else {
                return true;
            }
        } catch (error) {
            console.error('Error al eliminar pedido de BD:', error);
            throw error;
        }
    }

    async function cancelarOrden() {
        if (!ordenActual) return;
        
        try {
            mostrarCargando(true);
            
            if (ordenActual.idServidor) {
                await eliminarPedidoDeBD(ordenActual.idServidor);
                mostrarExito(`Orden ${ordenActual.id} cancelada y eliminada de la base de datos`);
            }
            
            const index = ordenesPendientes.findIndex(o => o.id === ordenActual.id);
            if (index !== -1) {
                ordenesPendientes.splice(index, 1);
            }
            
            ordenActual = null;
            mostrarVentanaOrdenes();
            
        } catch (error) {
            console.error('Error al cancelar orden:', error);
            mostrarError('Error al cancelar la orden: ' + error.message);
            
            const index = ordenesPendientes.findIndex(o => o.id === ordenActual.id);
            if (index !== -1) {
                ordenesPendientes.splice(index, 1);
            }
            ordenActual = null;
            mostrarVentanaOrdenes();
        } finally {
            mostrarCargando(false);
        }
    }

    async function aceptarOrden() {
        if (!ordenActual || ordenActual.productos.length === 0) {
            mostrarError('No hay productos en la orden');
            return;
        }

        try {
            mostrarCargando(true);
            
            if (!ordenActual.idServidor) {
                await crearPedidoEnBD(ordenActual);
            }
            
            const ordenParaCompletar = {
                idUsuarioCV: ID_USUARIO,
                estado: true, 
                detalles: ordenActual.productos.map(producto => ({
                    codigoProducto: producto.id,
                    cantidad: producto.cantidad
                }))
            };

            const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos/${ordenActual.idServidor}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ordenParaCompletar)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();

            ordenActual.estado = 'completada';
            ordenActual.estadoBD = true;
            ordenActual.idUsuarioCV = ID_USUARIO;
            ordenActual.fechaCompletada = new Date();
            const index = ordenesPendientes.findIndex(o => o.id === ordenActual.id);
            if (index !== -1) {
                ordenesPendientes.splice(index, 1);
            }

            ordenesCompletadas.push(ordenActual);
            
            mostrarExito(`Orden ${ordenActual.idServidor} completada exitosamente. Total: $${resultado.total || ordenActual.total.toFixed(2)}`);
            
            ordenActual = null;
            mostrarVentanaOrdenes();

        } catch (error) {
            console.error('Error al completar la orden:', error);
            mostrarError('Error al completar la orden: ' + error.message);
        } finally {
            mostrarCargando(false);
        }
    }

    function imprimirTicket() {
                if (!ordenActual) return;
                const ticketContent = `
        ======================
        ORDEN: ${ordenActual.id}
        ${ordenActual.idServidor ? 'ID SERVIDOR: ' + ordenActual.idServidor : ''}
        FECHA: ${formatearFecha(ordenActual.fecha)} ${formatearHora(ordenActual.fecha)}
        ======================
        ${ordenActual.productos.map(p => `${p.nombre} x${p.cantidad} $${p.subtotal.toFixed(2)}`).join('\n')}
        ======================
        TOTAL: $${ordenActual.total.toFixed(2)}
        ======================
        ¡GRACIAS POR SU COMPRA!
                `;
                console.log(ticketContent);
                alert('Ticket impreso (ver consola para detalles)');
        }
                    
                    async function imprimirTicket() {
                        if (!ordenActual?.idServidor) {
                            alert("Selecciona una orden válida primero");
                            return;
                        }

                        try {

                            window.open(
                                `${API_BASE_URL}/negocio/${codigoNegocio}/pedidos/${ordenActual.idServidor}`,
                                '_blank'
                            );
                            
                        } catch (error) {
                            console.error("Error al generar ticket:", error);
                            alert("Error al generar el ticket.");
                        }
                    }
         
                    
    document.querySelector('.btn-imprimir').addEventListener('click', async function() {
        try {
            await aceptarOrden();
            if (ordenActual) {
                imprimirTicket();
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al procesar: ' + error.message);
        }
    });

    async function mostrarHistorial() {
    try {
        mostrarCargando(true);
        
        await cargarVentasDesdeAPI();
        ventasRealizadas = ordenesCompletadas; 
        ventasRealizadas.sort((a, b) => new Date(b.fechaCompletada) - new Date(a.fechaCompletada));
        
        const tbody = document.getElementById('tbodyHistorial');
        tbody.innerHTML = '';

        if (ordenesCompletadas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay órdenes completadas</td></tr>';
        } else {
            ordenesCompletadas.forEach(orden => {
                const fila = document.createElement('tr');
                fila.classList.add('content-row');
                fila.addEventListener('click', () => seleccionarVenta(orden));
                
                const descripcion = orden.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ');
                fila.innerHTML = `
                    <td>${orden.idServidor || orden.id}</td>
                    <td>${descripcion}</td>
                    <td>$${orden.total.toFixed(2)}</td>
                    <td>${formatearFecha(orden.fechaCompletada)} ${formatearHora(orden.fechaCompletada)}</td>
                    <td>${orden.idServidor }</td>
                `;
                tbody.appendChild(fila);
            });
        }

        document.querySelector('.cancelarVenta-btn').disabled = true;
        
        document.getElementById('modalHistorial').style.display = 'flex';
        
    } catch (error) {
        console.error('Error al mostrar historial:', error);
        mostrarError('Error al cargar el historial: ' + error.message);
    } finally {
        mostrarCargando(false);
    }
}
    function mostrarCargando(mostrar) {
        if (mostrar) {
            console.log('Cargando...');
           
        } else {
            console.log('Carga completa');
        }
    }

    function mostrarError(mensaje) {
        alert('Error: ' + mensaje);
        console.error(mensaje);
    }

    function mostrarExito(mensaje) {
        alert('Éxito: ' + mensaje);
        console.log(mensaje);
    }

    function generarIdOrden() {
        return 'ORD' + (Math.floor(Math.random() * 900) + 100).toString();
    }

    function formatearFecha(fecha) {
        const d = new Date(fecha);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    function formatearFechaCorta(fecha) {
        const d = new Date(fecha);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
    }

    function formatearHora(fecha) {
        const d = new Date(fecha);
        const horas = d.getHours().toString().padStart(2, '0');
        const minutos = d.getMinutes().toString().padStart(2, '0');
        return `${horas}:${minutos}`;
    }

    function cerrarHistorial() {
    document.getElementById('modalHistorial').style.display = 'none';
}

function seleccionarVenta(venta) {
    ventaSeleccionada = venta;
    
    
    document.querySelectorAll('#tbodyHistorial tr').forEach(tr => {
        tr.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    document.querySelector('.cancelarVenta-btn').disabled = false;
}

async function cancelarVenta() {
    if (!ventaSeleccionada) {
        mostrarError('No hay ninguna venta seleccionada');
        return;
    }
    
    try {
        mostrarCargando(true);
        
        if (!confirm(`¿Estás seguro de que deseas cancelar la venta ${ventaSeleccionada.id}?`)) {
            return;
        }
        
        if (ventaSeleccionada.idServidor) {
            await eliminarVentaDeBD(ventaSeleccionada.idServidor);
        }
        
        const index = ordenesCompletadas.findIndex(v => v.id === ventaSeleccionada.id);
        if (index !== -1) {
            ordenesCompletadas.splice(index, 1);
        }
        
        mostrarExito(`Venta ${ventaSeleccionada.id} cancelada exitosamente`);
        ventaSeleccionada = null;
        await mostrarHistorial();
        
    } catch (error) {
        console.error('Error al cancelar venta:', error);
        mostrarError('Error al cancelar la venta: ' + error.message);
    } finally {
        mostrarCargando(false);
    }
}

async function eliminarVentaDeBD(idServidor) {
    try {
        const response = await fetch(`${API_BASE_URL}/negocio/${codigoNegocio}/pedidos/${idServidor}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error al eliminar venta de BD:', error);
        throw error;
    }
}

    document.querySelector('.cerrar-btn').addEventListener('click', mostrarVentanaOrdenes);
    document.querySelector('.btn-cerrar').addEventListener('click', mostrarVentanaOrdenes);
    document.querySelector('.btn-agregar').addEventListener('click', agregarOrden);
    document.querySelector('.btn-cancelar').addEventListener('click', cancelarOrden);
    document.querySelector('.btn-aceptar').addEventListener('click', aceptarOrden);
    document.querySelector('.btn-imprimir').addEventListener('click', imprimirTicket);
    document.querySelector('.btn-historial').addEventListener('click', mostrarHistorial);
    document.querySelector('.cancelarVenta-btn').addEventListener('click', cancelarVenta);
   
});

function cerrarSesion() {
   
    localStorage.removeItem('usuario');
    localStorage.removeItem('datosUsuario');
    sessionStorage.clear();
  
    window.location.href = '/VistaUusuario/Sesion.html';

}

