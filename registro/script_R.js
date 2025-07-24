function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<img src="./imagen/Group 24.png" alt="Ver contraseña" style="width: 25px;">';  
    } else {
        input.type = 'password';
        button.textContent = '👁️';
        
    }
}

// Función para mostrar mensajes de error o éxito
function mostrarMensaje(mensaje, tipo = 'error') {
    // Remover notificación anterior si existe
    const notificacionAnterior = document.querySelector('.notificacion');
    if (notificacionAnterior) {
        notificacionAnterior.remove();
    }
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos inline para la notificación
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ${tipo === 'error' ? 'background-color: #dc3545;' : 'background-color: #28a745;'}`
    ;
    
    document.body.appendChild(notificacion);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 5000);
}

// Función para validar los datos del formulario
function validarFormulario(datos) {
    const errores = [];
    
    if (!datos.company.trim()) {
        errores.push('El nombre de la empresa es obligatorio');
    }
    
    if (!datos.username.trim()) {
        errores.push('El nombre de usuario es obligatorio');
    }
    
    if (!datos.password) {
        errores.push('La contraseña es obligatoria');
    } else if (datos.password.length < 8) {
        errores.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!datos.confirmPassword) {
        errores.push('La confirmación de contraseña es obligatoria');
    }
    
    if (datos.password && datos.confirmPassword && datos.password !== datos.confirmPassword) {
        errores.push('Las contraseñas no coinciden');
    }
    
    return errores;
}

// Función para registrar usuario
async function registrarUsuario(datosUsuario) {
    try {
        const response = await fetch('http://52.73.124.1:7000/api/usuarios/registroAdmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosUsuario)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje('¡Registro exitoso!', 'success');
            localStorage.setItem("codigoNegocio", data.codigo_negocio);
            
            // Limpiar formulario
            document.getElementById('registerForm').reset();
            
            // Limpiar estilos de validación
            document.querySelectorAll('.form-control').forEach(input => {
                input.style.borderColor = '';
                input.setCustomValidity('');
            });
            
            // Opcional: redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = '/sesionadmin.html'; // Ajusta la ruta según tu aplicación
            }, 2000);
            
        } else {
            // Manejar errores del servidor
            const errorMessage = data.message || data.error || 'Error en el registro';
            mostrarMensaje(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Error en la petición:', error);
        mostrarMensaje('Error de conexión. Intente nuevamente.', 'error');
    }
}

// Función para validar contraseñas en tiempo real
function validarContrasenas() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordField.setCustomValidity('Las contraseñas no coinciden');
        confirmPasswordField.style.borderColor = '#dc3545';
        return false;
    } else {
        confirmPasswordField.setCustomValidity('');
        confirmPasswordField.style.borderColor = '';
        return true;
    }
}

// Event listener para el formulario
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = new FormData(this);
    const datosUsuario = {
        company: formData.get('company'),
        username: formData.get('username'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validar datos
    const errores = validarFormulario(datosUsuario);
    
    if (errores.length > 0) {
        mostrarMensaje(errores.join('. '), 'error');
        return;
    }
    
    // Mostrar loading (opcional)
    const submitBtn = this.querySelector('.btn-register');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registrando...';
    submitBtn.disabled = true;
    
    try {
        // Preparar datos para enviar (sin confirmPassword)
        const { confirmPassword, ...datosParaEnviar } = datosUsuario;
        
        await registrarUsuario(datosParaEnviar);
        
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Efectos de interacción mejorados
document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('focus', function() {
        if (this.parentElement.classList.contains('input-wrapper')) {
            this.parentElement.style.transform = 'translateY(-2px)';
        } else {
            this.parentElement.style.transform = 'translateY(-2px)';
        }
    });
    
    input.addEventListener('blur', function() {
        if (this.parentElement.classList.contains('input-wrapper')) {
            this.parentElement.style.transform = 'translateY(0)';
        } else {
            this.parentElement.style.transform = 'translateY(0)';
        }
    });
});

// Validación en tiempo real para las contraseñas
document.getElementById('confirmPassword').addEventListener('input', function() {
    validarContrasenas();
});

// También validar cuando se cambie la contraseña principal
document.getElementById('password').addEventListener('input', function() {
    // Validar longitud
    if (this.value.length > 0 && this.value.length < 8) {
        this.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
        this.style.borderColor = '#dc3545';
    } else {
        this.setCustomValidity('');
        this.style.borderColor = '';
    }
    
    // Revalidar confirmación si ya hay algo escrito
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (confirmPassword) {
        validarContrasenas();
    }
});

function validateInput(input) {
    
    const validChars = /^[a-zA-Z0-9 áéíóúÁÉÍÓÚñÑüÜ!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/;
    
    if (!validChars.test(input.value)) {
       
        input.value = input.value.replace(/[^\w áéíóúÁÉÍÓÚñÑüÜ!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]/g, '');
 
        showError("No se permiten emojis ni caracteres especiales complejos");
    }
}

document.getElementById('company').addEventListener('input', function(e) {
    validateInput(e.target);
});

document.getElementById('username').addEventListener('input', function(e) {
    validateInput(e.target);
});

document.getElementById('password').addEventListener('input', function(e) {
    validateInput(e.target);
});


// Modificar la función de submit para validar antes de enviar
document.getElementById('loginForm').addEventListener('submit', function(e) {
    const company = document.getElementById('company').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validar que no contengan emojis
    const emojiRegex = /[\u{1F600}-\u{1F6FF}]/u;
    if (emojiRegex.test(username) || emojiRegex.test(password) || emojiRegex.test(company)) {
        e.preventDefault();
        showError("No se permiten emojis en los campos");
        return;
    }
    
    // Resto de tu lógica de submit...
});


