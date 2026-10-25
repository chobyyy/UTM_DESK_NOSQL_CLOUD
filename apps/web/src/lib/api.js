import { USUARIOS_DEMO } from '../mockData';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function localMockLogin(cleanEmail) {
  let usuarios = [];
  try {
    const guardados = localStorage.getItem('utm_desk_usuarios');
    usuarios = guardados ? JSON.parse(guardados) : USUARIOS_DEMO;
  } catch {
    usuarios = USUARIOS_DEMO;
  }

  // Buscar usuario existente
  let user = usuarios.find((u) => u.correo?.toLowerCase() === cleanEmail);

  // Si no existe, crear cuenta automáticamente para permitir acceso con cualquier correo
  if (!user) {
    const usernamePart = cleanEmail.split('@')[0];
    const nombreFormateado = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);
    const iniciales = (usernamePart.slice(0, 2) || 'US').toUpperCase();

    user = {
      id: `usr-${Date.now()}`,
      nombre: nombreFormateado,
      correo: cleanEmail,
      rol: 'reportante',
      matricula: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
      carrera: 'Usuario General',
      avatar: iniciales,
      activo: true
    };

    usuarios.push(user);
    try {
      localStorage.setItem('utm_desk_usuarios', JSON.stringify(usuarios));
    } catch {
      // Continuar si quota de storage está restringida
    }
  }

  const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return { token: mockToken, user, isMock: true };
}

export async function login(correo, contrasena) {
  const cleanEmail = correo?.trim().toLowerCase();
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: cleanEmail, contrasena })
    });

    // Si el proxy de Vite o el backend responde con error de conexión (500 de proxy / 502 / 503)
    if (response.status >= 500) {
      const body = await response.json().catch(() => null);
      if (body && body.error && !body.error.toLowerCase().includes('proxy')) {
        throw new Error(body.error);
      }
      // Servidor backend apagado: fallback transparente al modo prototipo/local
      return localMockLogin(cleanEmail);
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || 'Correo o contraseña incorrectos.');
    }
    return body;
  } catch (error) {
    // Si la llamada fetch falla directamente (ej. backend no iniciado, error de red)
    if (
      error.message === 'Failed to fetch' ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError')
    ) {
      return localMockLogin(cleanEmail);
    }
    throw error;
  }
}
