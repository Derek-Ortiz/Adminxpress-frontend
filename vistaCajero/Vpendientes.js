   
        function cerrarVentana() {
            alert('Cerrando ventana...');
            // Aquí puedes agregar la lógica para cerrar la ventana
        }

        function agregarOrden() {
            alert('Agregando nueva orden...');
            // Aquí puedes agregar la lógica para agregar una nueva orden
        }

        // Función para agregar interactividad a los elementos de orden
        document.querySelectorAll('.orden-item').forEach(item => {
            item.addEventListener('click', function() {
                const codigo = this.querySelector('.orden-codigo').textContent;
                alert(`Seleccionaste la orden: ${codigo}`);
            });
            
            item.style.cursor = 'pointer';
        });
    