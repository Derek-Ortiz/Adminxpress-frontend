
        // Función para agregar datos dinámicamente
        function agregarFila(idPedido, descripcion, total, fecha, idUsuario) {
            const tabla = document.querySelector('table');
            const nuevaFila = document.createElement('tr');
            nuevaFila.className = 'content-row';
            
            nuevaFila.innerHTML = `
                <td>${idPedido}</td>
                <td>${descripcion}</td>
                <td>${total}</td>
                <td>${fecha}</td>
                <td>${idUsuario}</td>
            `;
            
            tabla.appendChild(nuevaFila);
        }

        // Función para limpiar la tabla
        function limpiarTabla() {
            const filas = document.querySelectorAll('.content-row');
            filas.forEach(fila => fila.remove());
        }

        // Función para cargar datos de ejemplo
        function cargarDatosEjemplo() {
            limpiarTabla();
            
            const datosEjemplo = [
                { id: '001', desc: 'Producto A', total: '$150.00', fecha: '2024-01-15', usuario: 'U001' },
                { id: '002', desc: 'Producto B', total: '$250.00', fecha: '2024-01-16', usuario: 'U002' },
                { id: '003', desc: 'Producto C', total: '$89.99', fecha: '2024-01-17', usuario: 'U003' },
                { id: '004', desc: 'Producto D', total: '$320.50', fecha: '2024-01-18', usuario: 'U004' },
                { id: '005', desc: 'Producto E', total: '$75.25', fecha: '2024-01-19', usuario: 'U005' }
            ];
            
            datosEjemplo.forEach(dato => {
                agregarFila(dato.id, dato.desc, dato.total, dato.fecha, dato.usuario);
            });
        }

        // Función para alternar entre datos de ejemplo y contenido genérico
        function alternarContenido() {
            const primeraFila = document.querySelector('.content-row td');
            
            if (primeraFila && primeraFila.textContent === 'contenido') {
                cargarDatosEjemplo();
            } else {
                limpiarTabla();
                // Recrear filas con contenido genérico
                for (let i = 0; i < 5; i++) {
                    agregarFila('contenido', 'contenido', 'contenido', 'contenido', 'contenido');
                }
            }
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Agregar evento de doble clic para alternar contenido
            document.querySelector('.table-container').addEventListener('dblclick', alternarContenido);
            
            // Agregar efecto de hover mejorado
            const filas = document.querySelectorAll('.content-row');
            filas.forEach(fila => {
                fila.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.01)';
                    this.style.transition = 'all 0.2s ease';
                });
                
                fila.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        });

        // Función para exportar datos (simulada)
        function exportarDatos() {
            const filas = document.querySelectorAll('.content-row');
            const datos = [];
            
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll('td');
                datos.push({
                    idPedido: celdas[0].textContent,
                    descripcion: celdas[1].textContent,
                    total: celdas[2].textContent,
                    fecha: celdas[3].textContent,
                    idUsuario: celdas[4].textContent
                });
            });
            
            console.log('Datos exportados:', datos);
            alert('Datos exportados a la consola');
        }