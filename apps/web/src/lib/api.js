import { USUARIOS_DEMO } from '../mockData';

const API_URL = import.meta.env.VITE_API_URL || '/api';
export const DEMO_PASSWORD = 'seguraUTM2026';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getStoredUsers() {
  try {
    const guardados = localStorage.getItem('utm_desk_usuarios');
    if (guardados) {
      const parsed = JSON.parse(guardados);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Si hay error de parsing, usar datos demo
  }
  return [...USUARIOS_DEMO];
}

function saveStoredUsers(users) {
  try {
    localStorage.setItem('utm_desk_usuarios', JSON.stringify(users));
  } catch {
    // Si excede cuota o está restringido
  }
}

/**
 * Autenticación local segura (se ejecuta solo si el backend API está apagado).
 * Valida estrictamente que el usuario exista y que la contraseña coincida.
 */
function localMockLogin(cleanEmail, contrasena) {
  const usuarios = getStoredUsers();
  const user = usuarios.find((u) => u.correo?.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('No existe una cuenta registrada con este correo. Por favor regístrate primero.');
  }

  if (user.activo === false) {
    throw new Error('Tu cuenta se encuentra inactiva. Contacta al administrador del sistema.');
  }

  // Si el usuario fue creado mediante el formulario de registro local, tiene 'contrasena'
  // Si es un usuario demo del sistema, su clave oficial es DEMO_PASSWORD
  const expectedPassword = user.contrasena || DEMO_PASSWORD;

  if (contrasena !== expectedPassword) {
    throw new Error('Contraseña incorrecta. Verifica tus datos de acceso.');
  }

  const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return { token: mockToken, user, isMock: true };
}

/**
 * Registro local seguro (se ejecuta solo si el backend API está apagado).
 */
function localMockRegister({ nombre, cleanEmail, contrasena, matricula, carrera }) {
  const usuarios = getStoredUsers();
  const existe = usuarios.find((u) => u.correo?.toLowerCase() === cleanEmail);

  if (existe) {
    throw new Error('Ya existe una cuenta registrada con este correo. Por favor inicia sesión.');
  }

  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'US';

  const newUser = {
    id: `usr-${Date.now()}`,
    nombre,
    correo: cleanEmail,
    contrasena,
    rol: 'reportante',
    matricula: matricula || `UTM-${Math.floor(100000 + Math.random() * 900000)}`,
    carrera: carrera || 'Comunidad Universitaria',
    avatar: iniciales,
    activo: true,
    creadoEn: new Date().toISOString()
  };

  usuarios.push(newUser);
  saveStoredUsers(usuarios);

  const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return { token: mockToken, user: newUser, isMock: true };
}

/**
 * Iniciar sesión (comunica con API y tiene fallback seguro)
 */
export async function login(correo, contrasena) {
  const cleanEmail = correo?.trim().toLowerCase();
  const cleanPassword = contrasena?.trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Correo y contraseña son obligatorios.');
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: cleanEmail, contrasena: cleanPassword })
    });

    // Errores de cliente (400, 401, 403, 404, etc.): son respuestas reales del backend, NO fallback
    if (response.status < 500) {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Correo o contraseña incorrectos.');
      }
      return body;
    }

    // Status 500+: si es proxy de Vite cuando no hay backend activo
    const errorBody = await response.json().catch(() => null);
    if (errorBody && errorBody.error && !errorBody.error.toLowerCase().includes('proxy')) {
      throw new Error(errorBody.error);
    }

    // Backend apagado -> validación local estricta
    return localMockLogin(cleanEmail, cleanPassword);
  } catch (error) {
    if (
      error.message === 'Failed to fetch' ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError')
    ) {
      return localMockLogin(cleanEmail, cleanPassword);
    }
    throw error;
  }
}

/**
 * Crear cuenta institucional (comunica con API y tiene fallback seguro)
 */
export async function register({ nombre, correo, contrasena, matricula, carrera }) {
  const cleanNombre = nombre?.trim();
  const cleanEmail = correo?.trim().toLowerCase();
  const cleanPassword = contrasena?.trim();
  const cleanMatricula = matricula?.trim();
  const cleanCarrera = carrera?.trim();

  if (!cleanNombre || !cleanEmail || !cleanPassword) {
    throw new Error('Nombre, correo y contraseña son obligatorios.');
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  if (cleanPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: cleanNombre,
        correo: cleanEmail,
        contrasena: cleanPassword,
        matricula: cleanMatricula,
        carrera: cleanCarrera
      })
    });

    if (response.status < 500) {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'No fue posible crear la cuenta.');
      }
      // Asegurar que el usuario nuevo quede también disponible en el almacenamiento local
      const usuarios = getStoredUsers();
      if (!usuarios.some((u) => u.correo?.toLowerCase() === cleanEmail)) {
        usuarios.push(body.user);
        saveStoredUsers(usuarios);
      }
      return body;
    }

    const errorBody = await response.json().catch(() => null);
    if (errorBody && errorBody.error && !errorBody.error.toLowerCase().includes('proxy')) {
      throw new Error(errorBody.error);
    }

    return localMockRegister({
      nombre: cleanNombre,
      cleanEmail,
      contrasena: cleanPassword,
      matricula: cleanMatricula,
      carrera: cleanCarrera
    });
  } catch (error) {
    if (
      error.message === 'Failed to fetch' ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError')
    ) {
      return localMockRegister({
        nombre: cleanNombre,
        cleanEmail,
        contrasena: cleanPassword,
        matricula: cleanMatricula,
        carrera: cleanCarrera
      });
    }
    throw error;
  }
}
