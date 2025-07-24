document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de reportes...');
    
    const btnDia = document.getElementById('btn-dia');
    const btnSemana = document.getElementById('btn-semana');
    const inputDesde = document.getElementById('desde');
    const hastaDiv = document.getElementById('hasta');
    const btnFiltrar = document.querySelector('.btn-filter');
    const btnExportar = document.querySelector('.btn-export');
    const masVendidosTab = document.querySelectorAll('#mas-vendidos')[0];
    const menosVendidosTab = document.querySelectorAll('#menos-vendidos')[0];

    // Verificar elementos DOM
    console.log('📋 Verificando elementos DOM:', {
        btnDia: !!btnDia,
        btnSemana: !!btnSemana,
        inputDesde: !!inputDesde,
        hastaDiv: !!hastaDiv,
        btnFiltrar: !!btnFiltrar,
        masVendidosTab: !!masVendidosTab,
        menosVendidosTab: !!menosVendidosTab
    });

    // Configuración de la API
    const API_BASE_URL = 'http://52.73.124.1:7000/api/reportes';
    
    // VERIFICACIÓN CRÍTICA: userData
    let userData;
    try {
        userData = JSON.parse(localStorage.getItem('userData'));
        console.log('👤 userData recuperado:', userData);
    } catch (error) {
        console.error('❌ Error al parsear userData:', error);
        userData = null;
    }

    const ID_NEGOCIO = userData?.codigo_negocio;
    
    
    
    console.log('🏢 ID_NEGOCIO confirmado:', ID_NEGOCIO);

    let tipoFiltro = 'dia';
    let desdeFecha = null;
    let hastaFecha = null;
    let mostrarMasVendidos = true;
    let loading = false;

    // Configuración del gráfico
    const chartCanvas = document.getElementById('salesChart');
    if (!chartCanvas) {
        console.error('❌ CRÍTICO: Canvas del gráfico no encontrado');
        mostrarError('Error: No se encontró el elemento del gráfico');
        return;
    }

    // Crear una sola instancia del gráfico
    const ctx = chartCanvas.getContext('2d');
    let salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Cargando...'], // Labels temporales
            datasets: [
                {
                    label: 'Ventas',
                    data: [0], // Datos temporales
                    backgroundColor: 'rgba(84, 146, 116, 0.7)',
                    borderColor: 'rgba(84, 146, 116, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gastos',
                    data: [0], // Datos temporales
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // Función para generar labels según el tipo de filtro
    function generarLabelsPorTipo(tipo, fechaDesde = null, fechaHasta = null) {
    if (tipo === 'dia') {
        const fecha = fechaDesde || new Date();
        const fechaStr = formatFecha(fecha);
        return Array.from({length: 1}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    } else {
        const labels = [];
        const fechaActual = new Date(fechaDesde);
        
        for (let i = 0; i < 7; i++) {
            labels.push(formatFecha(new Date(fechaActual)));
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
        
        return labels;
    }
}

    // Función para generar datos vacíos según el tipo de filtro
    function generarDataVacioPorTipo(tipo) {
        if (tipo === 'dia') {
            return new Array(1).fill(0); // 24 columnas para las horas
        } else {
            return new Array(7).fill(0); // 7 columnas para los días
        }
    }

    // Función para actualizar el gráfico según el tipo de filtro
    function actualizarTipoGrafico(nuevoTipo) {
        console.log('📊 Actualizando tipo de gráfico a:', nuevoTipo);
        
        // Actualizar labels y datos vacíos con las fechas actuales
        salesChart.data.labels = generarLabelsPorTipo(nuevoTipo, desdeFecha, hastaFecha);
        salesChart.data.datasets[0].data = generarDataVacioPorTipo(nuevoTipo);
        salesChart.data.datasets[1].data = generarDataVacioPorTipo(nuevoTipo);
        
        // Actualizar el gráfico
        salesChart.update();
        
        console.log('✅ Gráfico actualizado con', salesChart.data.labels.length, 'columnas');
        console.log('📋 Labels generados:', salesChart.data.labels);
    }
 

    console.log('📊 Gráfico inicializado correctamente');

    // Inicialización
    function inicializar() {
        console.log('🔄 Iniciando configuración inicial...');
        
        if (inputDesde) {
    // Cambiar esta parte:
    inputDesde.addEventListener('change', function() {
        const fechaStr = this.value; // Obtiene el valor en formato YYYY-MM-DD
        desdeFecha = new Date(fechaStr + 'T00:00:00'); // Fuerza hora local sin ajustes
        console.log('📅 Fecha desde cambiada (exacta):', desdeFecha);
        actualizarHastaFecha();
    });
}
        
        actualizarHastaFecha();
        
        // Inicializar el gráfico con las fechas correctas
        actualizarTipoGrafico(tipoFiltro);
        
        // Aplicar filtro inicial con delay para asegurar que todo esté listo
        setTimeout(() => {
            aplicarFiltro();
        }, 500);
    }

    // Event listeners con verificación
    if (btnDia) {
        btnDia.addEventListener('click', () => {
            console.log('🔘 Filtro día seleccionado');
            tipoFiltro = 'dia';
            btnDia.classList.add('active');
            if (btnSemana) btnSemana.classList.remove('active');
            actualizarTipoGrafico('dia');
            actualizarHastaFecha();
        });
    }

    if (btnSemana) {
        btnSemana.addEventListener('click', () => {
            console.log('🔘 Filtro semana seleccionado');
            tipoFiltro = 'semana';
            btnSemana.classList.add('active');
            if (btnDia) btnDia.classList.remove('active');
            actualizarTipoGrafico('semana');
            actualizarHastaFecha();
        });
    }

    if (inputDesde) {
    // Cambiar esta parte:
    inputDesde.addEventListener('change', function() {
        const fechaStr = this.value; // Obtiene el valor en formato YYYY-MM-DD
        desdeFecha = new Date(fechaStr + 'T00:00:00'); // Fuerza hora local sin ajustes
        console.log('📅 Fecha desde cambiada (exacta):', desdeFecha);
        actualizarHastaFecha();
    });
}

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', aplicarFiltro);
    }

    if (btnExportar) {
        btnExportar.addEventListener('click', exportarReporte);
    }

    if (masVendidosTab) {
        masVendidosTab.addEventListener('click', function() {
            console.log('🔝 Tab más vendidos seleccionado');
            mostrarMasVendidos = true;
            masVendidosTab.classList.add('active');
            if (menosVendidosTab) menosVendidosTab.classList.remove('active');
            actualizarTablaProductos();
        });
    }

    if (menosVendidosTab) {
        menosVendidosTab.addEventListener('click', function() {
            console.log('🔻 Tab menos vendidos seleccionado');
            mostrarMasVendidos = false;
            menosVendidosTab.classList.add('active');
            if (masVendidosTab) masVendidosTab.classList.remove('active');
            actualizarTablaProductos();
        });
    }

    // Funciones de utilidad
    function mostrarLoading(show) {
        loading = show;
        if (btnFiltrar) {
            btnFiltrar.disabled = show;
            btnFiltrar.textContent = show ? 'Cargando...' : 'Filtrar';
        }
        console.log('⏳ Estado de loading:', show);
    }

    function mostrarError(mensaje) {
        console.error('❌ Error mostrado al usuario:', mensaje);
        alert(mensaje);
    }

    function mostrarExito(mensaje) {
        console.log('✅ Éxito:', mensaje);
    }

    // FUNCIÓN CORREGIDA: Formato de fecha para la API
    function formatearFechaParaAPI(fecha, esInicio = true) {
    if (!fecha) return null;
    
    // Usar componentes locales (no UTC)
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    return esInicio 
        ? `${year}-${month}-${day}T00:00:00` 
        : `${year}-${month}-${day}T23:59:59`;
}

    // FUNCIÓN CORREGIDA: Construcción de parámetros de consulta
    function construirParametrosConsulta() {
        if (!desdeFecha || !hastaFecha) {
            console.error('❌ Fechas no válidas para construir parámetros');
            return '';
        }
        
        const params = new URLSearchParams();
        params.append('desde', formatearFechaParaAPI(desdeFecha, true));
        params.append('hasta', formatearFechaParaAPI(hastaFecha, false));
        
        const resultado = params.toString();
        console.log('🔗 Parámetros construidos:', resultado);
        return resultado;
    }

    // FUNCIÓN CORREGIDA: Realizar petición API
    async function realizarPeticionAPI(endpoint, parametros = '') {
        const url = `${API_BASE_URL}/${ID_NEGOCIO}/${endpoint}${parametros ? '?' + parametros : ''}`;
        
        console.log('🌐 Realizando petición:', {
            endpoint,
            url,
            parametros
        });

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                // Agregar timeout
                signal: AbortSignal.timeout(10000) // 10 segundos
            });
            
            console.log('📡 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Datos recibidos de', endpoint, ':', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error en petición API:', {
                endpoint,
                error: error.message,
                url
            });
            
            if (error.name === 'AbortError') {
                throw new Error('Timeout: La petición tardó demasiado');
            }
            
            throw error;
        }
    }

function actualizarHastaFecha() {
    if (!desdeFecha) return;
    
    // Crear copia exacta de la fecha desde
    hastaFecha = new Date(desdeFecha.getTime());
    
    if (tipoFiltro === 'semana') {
        // Para semana: agregar 6 días (total 7 días incluyendo el inicial)
        hastaFecha.setDate(hastaFecha.getDate() + 6);
    }
    // Para día: queda igual (misma fecha)
    
    // Actualizar UI
    if (hastaDiv) {
        hastaDiv.textContent = formatFecha(hastaFecha);
    }
    
    console.log('📅 Rango exacto:', {
        desde: formatFecha(desdeFecha),
        hasta: formatFecha(hastaFecha)
    });
}

    async function aplicarFiltro() {
        console.log('🔄 Aplicando filtro...');
        
        if (!desdeFecha) {
            //mostrarError('Por favor seleccione una fecha "Desde"');
            return;
        }

        if (!ID_NEGOCIO) {
            mostrarError('Error: Código de negocio no encontrado');
            return;
        }

        if (loading) {
            console.log('⚠️ Ya hay una operación en curso');
            return;
        }

        mostrarLoading(true);
        
        try {
            console.log('📊 Iniciando actualización de datos...');
            
            // Ejecutar todas las actualizaciones en paralelo
            const resultados = await Promise.allSettled([
                actualizarResumen(),
                actualizarTablaProductos(),
                actualizarGrafico()
            ]);
            
            // Verificar resultados
            resultados.forEach((resultado, index) => {
                const nombres = ['Resumen', 'Tabla de productos', 'Gráfico'];
                if (resultado.status === 'fulfilled') {
                    console.log(`✅ ${nombres[index]} actualizado correctamente`);
                } else {
                    console.error(`❌ Error en ${nombres[index]}:`, resultado.reason);
                }
            });
            
            // Verificar si al menos una actualización fue exitosa
            const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
            if (exitosos > 0) {
                console.log(`✅ ${exitosos}/3 secciones actualizadas correctamente`);
                mostrarExito('Datos actualizados correctamente');
            } else {
                throw new Error('No se pudo actualizar ninguna sección');
            }
            
        } catch (error) {
            console.error('❌ Error aplicando filtros:', error);
            mostrarError('Error al aplicar filtros: ' + error.message);
        } finally {
            mostrarLoading(false);
        }
    }

    async function actualizarResumen() {
        console.log('📋 Actualizando resumen...');
        const parametros = construirParametrosConsulta();
        
        if (!parametros) {
            throw new Error('No se pudieron construir los parámetros de consulta');
        }
        
        try {
            const [totalVentas, totalOrdenes, gastos, horaPico] = await Promise.all([
                realizarPeticionAPI('resumen/totalventas', parametros),
                realizarPeticionAPI('resumen/totalordenes', parametros),
                realizarPeticionAPI('resumen/gastos', parametros),
                realizarPeticionAPI('horapicoventas', parametros)
            ]);

            console.log('📊 Datos de resumen recibidos:', { totalVentas, totalOrdenes, gastos, horaPico});

            // Validación mejorada
            const ventasTotal = parseFloat(totalVentas?.total_ventas ?? 0);
            const gastosTotal = parseFloat(gastos?.gastos_totales ?? 0);
            const ordenesTotal = parseInt(totalOrdenes?.total_ordenes ?? 0);
            const horaPicoVentas = horaPico?.hora_pico_ventas ?? 0;
            const ganancias = ventasTotal - gastosTotal;

            console.log('💰 Valores calculados:', { ventasTotal, gastosTotal, ordenesTotal, ganancias, horaPicoVentas});


            // Actualizar UI
            const summaryValues = document.querySelectorAll('.summary-value');
            console.log('🎯 Elementos summary-value encontrados:', summaryValues.length);
            
            if (summaryValues.length >= 5) {
                summaryValues[0].textContent = `$${ventasTotal.toFixed(2)}`;
                summaryValues[1].textContent = ordenesTotal.toString();
                summaryValues[2].textContent = horaPicoVentas.toString();
                summaryValues[3].textContent = `$${ganancias.toFixed(2)}`;
                summaryValues[4].textContent = `$${gastosTotal.toFixed(2)}`;
                
                console.log('✅ Resumen actualizado en UI');
            } else {
                console.error('❌ No se encontraron suficientes elementos .summary-value');
                throw new Error('Elementos de resumen no encontrados en el DOM');
            }

        } catch (error) {
            console.error('❌ Error actualizando resumen:', error);
            
            // Mostrar valores por defecto
            const summaryValues = document.querySelectorAll('.summary-value');
            if (summaryValues.length >= 5) {
                summaryValues[0].textContent = '$0.00';
                summaryValues[1].textContent = '0';
                summaryValues[2].textContent = 'N/A';
                summaryValues[3].textContent = '$0.00';
                summaryValues[4].textContent = '$0.00';
            }
            
            throw error;
        }
    }


    async function actualizarTablaProductos() {
        console.log('📦 Actualizando tabla de productos...');
        const parametros = construirParametrosConsulta();
        const endpoint = mostrarMasVendidos ? 'top-productos/masvendidos' : 'top-productos/menosvendidos';
        
        try {
            const productos = await realizarPeticionAPI(endpoint, parametros);
            
            console.log('📦 Datos de productos recibidos:', productos);
            
            if (!productos) {
                throw new Error('No se recibieron datos de productos');
            }

            // Determinar la estructura de datos
            let listaProductos = [];
            if (productos.productos && Array.isArray(productos.productos)) {
                listaProductos = productos.productos;
            } else if (Array.isArray(productos)) {
                listaProductos = productos;
            } else {
                console.error('❌ Estructura de productos desconocida:', productos);
                throw new Error('Formato de datos de productos no válido');
            }

            const tbody = document.querySelector('.products-table tbody');
            if (!tbody) {
                console.error('❌ Tabla de productos no encontrada');
                throw new Error('Tabla de productos no encontrada en el DOM');
            }

            tbody.innerHTML = '';

            const topProductos = listaProductos.slice(0, 3);
            console.log('📊 Top productos a mostrar:', topProductos);

            if (topProductos.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="3" style="text-align: center; color: #666;">No hay productos para mostrar</td>';
                tbody.appendChild(row);
                return;
            }

            topProductos.forEach((producto, index) => {
                if (!producto) return;
                
                const row = document.createElement('tr');
                const nombre = producto.nombre || producto.name || 'Producto sin nombre';
                const cantidad = parseInt(producto.totalVendido || 0);
                const precio = parseFloat(producto.precioActual || producto.price || 0);
                
                row.innerHTML = `
                    <td>${nombre}</td>
                    <td style="text-align: center;">${cantidad}</td>
                    <td style="text-align: right;">$${precio.toFixed(2)}</td>
                `;
                tbody.appendChild(row);
                
                console.log(`✅ Producto ${index + 1} agregado:`, { nombre, cantidad, precio });
            });

            console.log('✅ Tabla de productos actualizada');

        } catch (error) {
            console.error('❌ Error actualizando tabla de productos:', error);
            
            const tbody = document.querySelector('.products-table tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error al cargar productos</td></tr>';
            }
            
            throw error;
        }
    }

    async function actualizarGrafico() {
    console.log('📊 Actualizando gráfico...');
    const parametros = construirParametrosConsulta();
    
    try {
        if (tipoFiltro === 'semana') {
            // Caso semana: hacer una petición por cada día
            let ventasData = [];
            let gastosData = [];
            let labels = generarLabelsPorTipo('semana', desdeFecha, hastaFecha);

            for (let i = 0; i < 7; i++) {
                let fecha = new Date(desdeFecha);
                fecha.setDate(fecha.getDate() + i);

                let desde = formatearFechaParaAPI(fecha, true);
                let hasta = formatearFechaParaAPI(fecha, false);

                let params = new URLSearchParams();
                params.append('desde', desde);
                params.append('hasta', hasta);

                // Petición para ese día
                let utilidadDia = await realizarPeticionAPI('ventas-gastos', params.toString());

                // Asigna los datos al día correspondiente
                ventasData[i] = parseFloat(
                    utilidadDia.ventas_totales || 
                    utilidadDia.total_ventas || 
                    utilidadDia.ventas || 
                    0
                );
                
                gastosData[i] = parseFloat(
                    utilidadDia.gastos_totales || 
                    utilidadDia.total_gastos || 
                    utilidadDia.gastos || 
                    0
                );
            }

            // Actualiza el gráfico
            salesChart.data.labels = labels;
            salesChart.data.datasets[0].data = ventasData;
            salesChart.data.datasets[1].data = gastosData;
            salesChart.update();
            
            console.log('✅ Gráfico semanal actualizado');
            return;
        }
        
        // Caso día: solo una columna con el total del día
        const utilidad = await realizarPeticionAPI('ventas-gastos', parametros);
        let ventasData = [0];
        let gastosData = [0];
        let labels = [formatFecha(desdeFecha)];

        // Si hay datos desglosados, sumar todos los valores
        if (utilidad.datos && Array.isArray(utilidad.datos) && utilidad.datos.length > 0) {
            utilidad.datos.forEach(item => {
                ventasData[0] += parseFloat(item.ventas || item.sales || 0);
                gastosData[0] += parseFloat(item.gastos || item.expenses || 0);
            });
        } else {
            ventasData[0] = parseFloat(
                utilidad.ventas_totales || 
                utilidad.total_ventas || 
                utilidad.ventas || 
                0
            );
            gastosData[0] = parseFloat(
                utilidad.gastos_totales || 
                utilidad.total_gastos || 
                utilidad.gastos || 
                0
            );
        }

        // Actualiza el gráfico
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = ventasData;
        salesChart.data.datasets[1].data = gastosData;
        salesChart.update();
        console.log('✅ Gráfico diario actualizado (solo total del día)');
        
    } catch (error) {
        // Manejo de errores
    }
}

function exportarReporte() {
    if (!desdeFecha || !hastaFecha) {
        alert('Por favor selecciona las fechas para el reporte');
        return;
    }
    
    // Formatear fechas en formato yyyy-MM-dd como espera el backend
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };
    
    const fechaDesde = formatDate(desdeFecha);
    const fechaHasta = formatDate(hastaFecha);
    
    // Añadir timestamp para evitar caché
    const timestamp = new Date().getTime();
    const url = `${API_BASE_URL}/${ID_NEGOCIO}/exportar?desde=${fechaDesde}&hasta=${fechaHasta}&nocache=${timestamp}`;
    
    console.log('📄 URL de exportación:', {
        url,
        desdeFecha,
        hastaFecha,
        fechaDesde,
        fechaHasta
    });
    
    // Abrir en nueva pestaña
    window.open(url, '_blank');
}

    function formatFecha(fecha) {
        if (!fecha) return '--/--/----';
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    }

    // Manejo de conectividad
    window.addEventListener('online', function() {
        console.log('🌐 Conexión restaurada');
        if (!loading) {
            aplicarFiltro();
        }
    });

    window.addEventListener('offline', function() {
        console.log('📵 Conexión perdida');
        mostrarError('Sin conexión a internet');
    });

    // Inicializar la aplicación
    inicializar();
    
    console.log('🎉 Aplicación de reportes inicializada completamente');
});