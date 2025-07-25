let selectedRow = null;
let selectedUserId = null;
const userData = JSON.parse(localStorage.getItem('userData'));
const codigoNegocio = userData?.codigo_negocio;

if (!codigoNegocio) {
    alert("Error: No se encontró el código del negocio. Inicia sesión nuevamente.");
    window.location.href = "/index.html"; 
}

function showError(fieldId, message) {
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '12px';
    
    const field = document.getElementById(fieldId);
    const parent = field.parentElement;
    
    const existingError = parent.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    parent.appendChild(errorElement);
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

function validateFormData(formData) {
    let isValid = true;
    
    if (!formData.nombre) {
        showError('nombre', '*Ingrese al menos un nombre');
        isValid = false;
    }
    
    if (!formData.apellidoPaterno) {
        showError('apellidoPaterno', '*Ingrese un apellido');
        isValid = false;
    }
    
    if (!formData.apellidoMaterno) {
        showError('apellidoMaterno', '*Ingrese un apellido');
        isValid = false;
    }
    
    if (!formData.usuario) {
        showError('username', '*Ingrese un nombre de usuario');
        isValid = false;
    }
    
    if (!formData.curp) {
        showError('curp', '*El CURP es obligatorio');
        isValid = false;
    } else if (formData.curp.length !== 18) {
        showError('curp', '*El CURP debe tener 18 caracteres');
        isValid = false;
    }
    
    if (!formData.contrasena) {
        showError('contrasena', '*Ingrese una contraseña');
        isValid = false;
    }
    
    if (!formData.cargo) {
        showError('cargo', '*Asigne un cargo');
        isValid = false;
    }
    
    return isValid;
}

function cargarUsuarios() {
    fetch(`http://52.73.124.1:7000/api/negocio/${codigoNegocio}/usuarios`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector(".data-table tbody");
            tbody.innerHTML = "";

            data.forEach(usuario => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.usuario}</td>
                    <td>${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}</td>
                    <td>${usuario.curp}</td>
                    <td>${usuario.cargo.charAt(0).toUpperCase() + usuario.cargo.slice(1)}</td>
                `;
                row.addEventListener("click", () => seleccionarFila(row, usuario.id));
                tbody.appendChild(row);
            });

            selectedRow = null;
            selectedUserId = null;
            document.querySelector('.btn-edit').disabled = true;
            document.querySelector('.btn-delete').disabled = true;
        })
        .catch(err => console.error("Error cargando usuarios:", err));
}

function seleccionarFila(row, id) {
    if (selectedRow) selectedRow.classList.remove('selected');
    row.classList.add('selected');
    selectedRow = row;
    selectedUserId = id;
    document.querySelector('.btn-edit').disabled = false;
    document.querySelector('.btn-delete').disabled = false;
}

const btnAdd = document.querySelector('.btn-add');
const userModal = document.getElementById('userModal');
const closeModalBtn = document.getElementById('closeModal');

btnAdd.addEventListener('click', () => {
    userModal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    userModal.classList.remove('active');
    clearErrors();
});

const userForm = document.getElementById('userForm');
userForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    const nuevoUsuario = {
        nombre: document.getElementById('nombre').value.trim(),
        apellidoPaterno: document.getElementById('apellidoPaterno').value.trim(),
        apellidoMaterno: document.getElementById('apellidoMaterno').value.trim(),
        usuario: document.getElementById('username').value.trim(),
        curp: document.getElementById('curp').value.trim(),
        contrasena: document.getElementById('contrasena').value.trim(),
        cargo: document.getElementById('cargo').value,
        codigoNegocio: codigoNegocio 
    };

    if (!validateFormData(nuevoUsuario)) return;

    fetch("http://52.73.124.1:7000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario)
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al registrar usuario");
        return res.json();
    })
    .then(() => {
        alert("Usuario registrado exitosamente");
        userForm.reset();
        userModal.classList.remove('active');
        cargarUsuarios();
    })
    .catch(err => {
        alert("Error al registrar usuario: " + err.message);
        console.error(err);
    });
});

const btnEdit = document.querySelector('.btn-edit');
const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const editForm = document.getElementById('editUserForm');

btnEdit.addEventListener('click', () => {
    if (!selectedUserId) {
        alert("Seleccione un usuario para editar");
        return;
    }

    const cells = selectedRow.cells;
    const nombres = cells[2].textContent.split(' ');
    document.getElementById('editNombre').value = nombres[0] || '';
    document.getElementById('editApellidoPaterno').value = nombres[1] || '';
    document.getElementById('editApellidoMaterno').value = nombres.slice(2).join(' ') || '';
    document.getElementById('editUsername').value = cells[1].textContent;
    document.getElementById('editCurp').value = cells[3].textContent;
    document.getElementById('editCargo').value = cells[4].textContent.toLowerCase();
    document.getElementById('editContrasena').value = '';

    editModal.classList.add('active');
});

closeEditModalBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
    clearErrors();
});

editForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();

    if (!selectedUserId) {
        alert("No hay usuario seleccionado");
        return;
    }

    const usuarioEditado = {
        nombre: document.getElementById('editNombre').value.trim(),
        apellidoPaterno: document.getElementById('editApellidoPaterno').value.trim(),
        apellidoMaterno: document.getElementById('editApellidoMaterno').value.trim(),
        usuario: document.getElementById('editUsername').value.trim(),
        curp: document.getElementById('editCurp').value.trim(),
        cargo: document.getElementById('editCargo').value
    };

    let hasErrors = false;
    
    if (!usuarioEditado.nombre) {
        showError('editNombre', '*Ingrese al menos un nombre');
        hasErrors = true;
    }
    
    if (!usuarioEditado.apellidoPaterno) {
        showError('editApellidoPaterno', '*Ingrese un apellido');
        hasErrors = true;
    }
    
    if (!usuarioEditado.apellidoMaterno) {
        showError('editApellidoMaterno', '*Ingrese un apellido');
        hasErrors = true;
    }
    
    if (!usuarioEditado.usuario) {
        showError('editUsername', '*Ingrese un nombre de usuario');
        hasErrors = true;
    }
    
    if (!usuarioEditado.curp) {
        showError('editCurp', '*El CURP es obligatorio');
        hasErrors = true;
    } else if (usuarioEditado.curp.length !== 18) {
        showError('editCurp', '*El CURP debe tener 18 caracteres');
        hasErrors = true;
    }
    
    if (!usuarioEditado.cargo) {
        showError('editCargo', '*Asigne un cargo');
        hasErrors = true;
    }
    
    if (hasErrors) return;

    const pass = document.getElementById('editContrasena').value.trim();
    if (pass !== "") {
        usuarioEditado.contrasena = pass;
    }

    fetch(`http://52.73.124.1:7000/api/usuarios/${selectedUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioEditado)
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al actualizar usuario");
        return res.json();
    })
    .then(() => {
        alert("Usuario actualizado exitosamente");
        editForm.reset();
        editModal.classList.remove('active');
        cargarUsuarios();
    })
    .catch(err => {
        alert("Error al actualizar usuario: " + err.message);
        console.error(err);
    });
});

const btnDelete = document.querySelector('.btn-delete');
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const closeConfirmDeleteBtn = document.getElementById('closeConfirmDeleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const userToDeleteName = document.getElementById('userToDeleteName');

btnDelete.addEventListener('click', () => {
    if (!selectedUserId) {
        alert("Seleccione un usuario para eliminar");
        return;
    }
    
    userToDeleteName.textContent = selectedRow.cells[2].textContent;
    
    confirmDeleteModal.classList.add('active');
});

confirmDeleteBtn.addEventListener('click', () => {
    fetch(`http://52.73.124.1:7000/api/usuarios/${selectedUserId}`, {
        method: "DELETE"
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al eliminar usuario");
        
        confirmDeleteModal.classList.remove('active');
        
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
        
        cargarUsuarios();
    })
    .catch(err => {
        confirmDeleteModal.classList.remove('active');
        alert("Error al eliminar usuario: " + err.message);
        console.error(err);
    });
});

cancelDeleteBtn.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('active');
});

closeConfirmDeleteBtn.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('active');
});

confirmDeleteModal.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) {
        confirmDeleteModal.classList.remove('active');
    }
});

function cerrarSesion() {
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/VistaUusuario/index.html';
}

document.addEventListener('DOMContentLoaded', cargarUsuarios);