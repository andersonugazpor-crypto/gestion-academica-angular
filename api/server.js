/**
 * API REST simulada para el sistema de Gestión Académica.
 *
 * - Sin dependencias externas: solo módulos nativos de Node.js (http, crypto, fs).
 * - Autenticación con JWT firmado con HS256 y fecha de expiración.
 * - Control de acceso por rol: admin, profesor, estudiante.
 * - Persistencia en api/db.json (se crea a partir de api/db.seed.json).
 *
 * Uso:  node api/server.js            (puerto 3000, token de 60 minutos)
 *       PORT=3001 TOKEN_EXP=120 node api/server.js
 *       node api/server.js --reset     (restaura los datos iniciales)
 */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const TOKEN_EXP = Number(process.env.TOKEN_EXP || 3600); // segundos
const SECRET = process.env.JWT_SECRET || 'idat-desarrollo-interfaces-3-secreto';
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.json');
const SEED_FILE = path.join(__dirname, 'db.seed.json');
const ROLES = ['admin', 'profesor', 'estudiante'];

// ---------------------------------------------------------------- datos
if (process.argv.includes('--reset') || !fs.existsSync(DB_FILE)) {
  fs.copyFileSync(SEED_FILE, DB_FILE);
}
let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const guardar = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
const siguienteId = (lista) => lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;

const hashPassword = (password, salt) =>
  crypto.createHash('sha256').update(salt + ':' + password).digest('hex');

/** Nunca se devuelve el hash ni la sal al cliente. */
const usuarioPublico = ({ salt, passwordHash, ...resto }) => resto;

const cursoPublico = (curso) => {
  const profesor = db.usuarios.find((u) => u.id === curso.profesorId);
  return {
    ...curso,
    profesorNombre: profesor ? profesor.nombre : null,
    inscritos: curso.estudiantes.length,
  };
};

// ---------------------------------------------------------------- JWT
const b64url = (input) => Buffer.from(input).toString('base64url');

function firmarToken(usuario) {
  const ahora = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      iat: ahora,
      exp: ahora + TOKEN_EXP,
    })
  );
  const firma = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${firma}`;
}

/** Devuelve { payload } si el token es válido, o { error } con el motivo. */
function verificarToken(token) {
  const partes = (token || '').split('.');
  if (partes.length !== 3) return { error: 'Token mal formado' };
  const [header, payload, firma] = partes;
  const esperada = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { error: 'Firma del token inválida' };
  let datos;
  try {
    datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { error: 'Token mal formado' };
  }
  if (!datos.exp || datos.exp < Math.floor(Date.now() / 1000)) return { error: 'Token expirado' };
  return { payload: datos };
}

// ---------------------------------------------------------------- utilidades HTTP
function responder(res, status, cuerpo) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(cuerpo === undefined ? '' : JSON.stringify(cuerpo));
}

const error = (res, status, mensaje, errores) =>
  responder(res, status, { status, mensaje, ...(errores ? { errores } : {}) });

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let datos = '';
    req.on('data', (chunk) => {
      datos += chunk;
      if (datos.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!datos) return resolve({});
      try {
        resolve(JSON.parse(datos));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
  });
}

/** Middleware: exige un token válido y, opcionalmente, uno de los roles indicados. */
function autenticar(req, res, rolesPermitidos) {
  const cabecera = req.headers['authorization'] || '';
  if (!cabecera.startsWith('Bearer ')) {
    error(res, 401, 'Se requiere un token de acceso');
    return null;
  }
  const { payload, error: motivo } = verificarToken(cabecera.slice(7));
  if (!payload) {
    error(res, 401, motivo);
    return null;
  }
  const usuario = db.usuarios.find((u) => u.id === payload.sub && u.activo);
  if (!usuario) {
    error(res, 401, 'El usuario del token ya no existe o está inactivo');
    return null;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    error(res, 403, `Acceso denegado: se requiere rol ${rolesPermitidos.join(' o ')}`);
    return null;
  }
  return usuario;
}

// ---------------------------------------------------------------- validaciones
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarUsuario(datos, esNuevo) {
  const errores = {};
  if (!datos.nombre || String(datos.nombre).trim().length < 3) errores.nombre = 'Mínimo 3 caracteres';
  if (!datos.email || !EMAIL_RE.test(datos.email)) errores.email = 'Correo inválido';
  if (!ROLES.includes(datos.rol)) errores.rol = 'Rol inválido';
  if (esNuevo && (!datos.password || String(datos.password).length < 6)) errores.password = 'Mínimo 6 caracteres';
  if (!esNuevo && datos.password && String(datos.password).length < 6) errores.password = 'Mínimo 6 caracteres';
  return errores;
}

function validarCurso(datos) {
  const errores = {};
  if (!datos.codigo || !/^[A-Z0-9-]{3,12}$/.test(datos.codigo)) errores.codigo = 'Formato: letras mayúsculas, números y guiones (3 a 12)';
  if (!datos.nombre || String(datos.nombre).trim().length < 3) errores.nombre = 'Mínimo 3 caracteres';
  const creditos = Number(datos.creditos);
  if (!Number.isInteger(creditos) || creditos < 1 || creditos > 6) errores.creditos = 'Entero entre 1 y 6';
  const horas = Number(datos.horas);
  if (!Number.isInteger(horas) || horas < 16 || horas > 160) errores.horas = 'Entero entre 16 y 160';
  const cupos = Number(datos.cupos);
  if (!Number.isInteger(cupos) || cupos < 1 || cupos > 100) errores.cupos = 'Entero entre 1 y 100';
  if (!['ACTIVO', 'INACTIVO'].includes(datos.estado)) errores.estado = 'ACTIVO o INACTIVO';
  return errores;
}

// ---------------------------------------------------------------- rutas
async function manejar(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ruta = url.pathname.replace(/\/+$/, '') || '/';
  const metodo = req.method;

  if (metodo === 'OPTIONS') return responder(res, 204);

  let cuerpo = {};
  if (metodo === 'POST' || metodo === 'PUT') {
    try {
      cuerpo = await leerCuerpo(req);
    } catch {
      return error(res, 400, 'El cuerpo de la petición no es JSON válido');
    }
  }

  // ---- salud
  if (ruta === '/api' && metodo === 'GET') {
    return responder(res, 200, { nombre: 'API Gestión Académica', version: '1.0.0', estado: 'ok' });
  }

  // ---- autenticación
  if (ruta === '/api/auth/login' && metodo === 'POST') {
    const { email, password } = cuerpo;
    if (!email || !password) return error(res, 400, 'Correo y contraseña son obligatorios');
    const usuario = db.usuarios.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!usuario || usuario.passwordHash !== hashPassword(password, usuario.salt)) {
      return error(res, 401, 'Credenciales incorrectas');
    }
    if (!usuario.activo) return error(res, 403, 'El usuario está inactivo');
    return responder(res, 200, {
      token: firmarToken(usuario),
      tipo: 'Bearer',
      expiraEn: TOKEN_EXP,
      usuario: usuarioPublico(usuario),
    });
  }

  if (ruta === '/api/auth/perfil' && metodo === 'GET') {
    const yo = autenticar(req, res);
    if (!yo) return;
    return responder(res, 200, usuarioPublico(yo));
  }

  // ---- estadísticas para el dashboard (según rol)
  if (ruta === '/api/estadisticas' && metodo === 'GET') {
    const yo = autenticar(req, res);
    if (!yo) return;
    if (yo.rol === 'admin') {
      return responder(res, 200, {
        totalUsuarios: db.usuarios.length,
        totalCursos: db.cursos.length,
        cursosActivos: db.cursos.filter((c) => c.estado === 'ACTIVO').length,
        porRol: ROLES.reduce((acc, r) => ({ ...acc, [r]: db.usuarios.filter((u) => u.rol === r).length }), {}),
      });
    }
    if (yo.rol === 'profesor') {
      const mios = db.cursos.filter((c) => c.profesorId === yo.id);
      return responder(res, 200, {
        misCursos: mios.length,
        totalEstudiantes: mios.reduce((s, c) => s + c.estudiantes.length, 0),
        cursos: mios.map(cursoPublico),
      });
    }
    const inscritos = db.cursos.filter((c) => c.estudiantes.includes(yo.id));
    return responder(res, 200, {
      cursosInscritos: inscritos.length,
      creditos: inscritos.reduce((s, c) => s + c.creditos, 0),
      cursos: inscritos.map(cursoPublico),
    });
  }

  // ---- usuarios (solo admin)
  if (ruta === '/api/usuarios' && metodo === 'GET') {
    const yo = autenticar(req, res, ['admin']);
    if (!yo) return;
    const rol = url.searchParams.get('rol');
    const lista = rol ? db.usuarios.filter((u) => u.rol === rol) : db.usuarios;
    return responder(res, 200, lista.map(usuarioPublico));
  }

  if (ruta === '/api/usuarios' && metodo === 'POST') {
    const yo = autenticar(req, res, ['admin']);
    if (!yo) return;
    const errores = validarUsuario(cuerpo, true);
    if (Object.keys(errores).length) return error(res, 400, 'Datos inválidos', errores);
    if (db.usuarios.some((u) => u.email.toLowerCase() === cuerpo.email.toLowerCase())) {
      return error(res, 409, 'Ya existe un usuario con ese correo');
    }
    const salt = crypto.randomBytes(8).toString('hex');
    const nuevo = {
      id: siguienteId(db.usuarios),
      nombre: String(cuerpo.nombre).trim(),
      email: cuerpo.email.toLowerCase(),
      rol: cuerpo.rol,
      activo: cuerpo.activo !== false,
      salt,
      passwordHash: hashPassword(cuerpo.password, salt),
      creadoEn: new Date().toISOString(),
    };
    db.usuarios.push(nuevo);
    guardar();
    return responder(res, 201, usuarioPublico(nuevo));
  }

  let m = ruta.match(/^\/api\/usuarios\/(\d+)$/);
  if (m) {
    const yo = autenticar(req, res, ['admin']);
    if (!yo) return;
    const id = Number(m[1]);
    const usuario = db.usuarios.find((u) => u.id === id);
    if (!usuario) return error(res, 404, 'Usuario no encontrado');

    if (metodo === 'GET') return responder(res, 200, usuarioPublico(usuario));

    if (metodo === 'PUT') {
      const datos = { ...usuarioPublico(usuario), ...cuerpo };
      const errores = validarUsuario(datos, false);
      if (Object.keys(errores).length) return error(res, 400, 'Datos inválidos', errores);
      if (db.usuarios.some((u) => u.id !== id && u.email.toLowerCase() === datos.email.toLowerCase())) {
        return error(res, 409, 'Ya existe un usuario con ese correo');
      }
      if (id === yo.id && (datos.rol !== 'admin' || datos.activo === false)) {
        return error(res, 400, 'No puedes quitarte el rol de administrador ni desactivarte');
      }
      usuario.nombre = String(datos.nombre).trim();
      usuario.email = datos.email.toLowerCase();
      usuario.rol = datos.rol;
      usuario.activo = datos.activo !== false;
      if (cuerpo.password) {
        usuario.salt = crypto.randomBytes(8).toString('hex');
        usuario.passwordHash = hashPassword(cuerpo.password, usuario.salt);
      }
      guardar();
      return responder(res, 200, usuarioPublico(usuario));
    }

    if (metodo === 'DELETE') {
      if (id === yo.id) return error(res, 400, 'No puedes eliminar tu propia cuenta');
      if (db.cursos.some((c) => c.profesorId === id)) {
        return error(res, 409, 'El profesor tiene cursos asignados; reasígnalos antes de eliminarlo');
      }
      db.usuarios = db.usuarios.filter((u) => u.id !== id);
      db.cursos.forEach((c) => (c.estudiantes = c.estudiantes.filter((e) => e !== id)));
      guardar();
      return responder(res, 204);
    }
  }

  // ---- profesores (para el selector del formulario de cursos)
  if (ruta === '/api/profesores' && metodo === 'GET') {
    const yo = autenticar(req, res, ['admin', 'profesor']);
    if (!yo) return;
    return responder(
      res,
      200,
      db.usuarios.filter((u) => u.rol === 'profesor' && u.activo).map((u) => ({ id: u.id, nombre: u.nombre }))
    );
  }

  // ---- cursos
  if (ruta === '/api/cursos' && metodo === 'GET') {
    const yo = autenticar(req, res);
    if (!yo) return;
    let lista = db.cursos;
    if (yo.rol === 'estudiante') lista = lista.filter((c) => c.estado === 'ACTIVO');
    const q = (url.searchParams.get('q') || '').toLowerCase();
    if (q) lista = lista.filter((c) => (c.nombre + ' ' + c.codigo).toLowerCase().includes(q));
    return responder(
      res,
      200,
      lista.map((c) => ({ ...cursoPublico(c), inscrito: c.estudiantes.includes(yo.id) }))
    );
  }

  if (ruta === '/api/cursos' && metodo === 'POST') {
    const yo = autenticar(req, res, ['admin', 'profesor']);
    if (!yo) return;
    const datos = { ...cuerpo, codigo: String(cuerpo.codigo || '').toUpperCase() };
    // Un profesor solo puede crear cursos a su nombre.
    datos.profesorId = yo.rol === 'profesor' ? yo.id : Number(cuerpo.profesorId);
    const errores = validarCurso(datos);
    if (!db.usuarios.some((u) => u.id === datos.profesorId && u.rol === 'profesor')) {
      errores.profesorId = 'Selecciona un profesor válido';
    }
    if (Object.keys(errores).length) return error(res, 400, 'Datos inválidos', errores);
    if (db.cursos.some((c) => c.codigo === datos.codigo)) return error(res, 409, 'Ya existe un curso con ese código');
    const nuevo = {
      id: siguienteId(db.cursos),
      codigo: datos.codigo,
      nombre: String(datos.nombre).trim(),
      descripcion: String(datos.descripcion || '').trim(),
      creditos: Number(datos.creditos),
      horas: Number(datos.horas),
      profesorId: datos.profesorId,
      estado: datos.estado,
      cupos: Number(datos.cupos),
      estudiantes: [],
    };
    db.cursos.push(nuevo);
    guardar();
    return responder(res, 201, cursoPublico(nuevo));
  }

  m = ruta.match(/^\/api\/cursos\/(\d+)(\/inscripcion)?$/);
  if (m) {
    const id = Number(m[1]);
    const curso = db.cursos.find((c) => c.id === id);

    // Inscripción de estudiantes
    if (m[2]) {
      const yo = autenticar(req, res, ['estudiante']);
      if (!yo) return;
      if (!curso) return error(res, 404, 'Curso no encontrado');
      if (metodo === 'POST') {
        if (curso.estado !== 'ACTIVO') return error(res, 400, 'El curso no está activo');
        if (curso.estudiantes.includes(yo.id)) return error(res, 409, 'Ya estás inscrito en este curso');
        if (curso.estudiantes.length >= curso.cupos) return error(res, 409, 'No hay cupos disponibles');
        curso.estudiantes.push(yo.id);
        guardar();
        return responder(res, 201, { ...cursoPublico(curso), inscrito: true });
      }
      if (metodo === 'DELETE') {
        if (!curso.estudiantes.includes(yo.id)) return error(res, 404, 'No estás inscrito en este curso');
        curso.estudiantes = curso.estudiantes.filter((e) => e !== yo.id);
        guardar();
        return responder(res, 204);
      }
      return error(res, 405, 'Método no permitido');
    }

    if (metodo === 'GET') {
      const yo = autenticar(req, res);
      if (!yo) return;
      if (!curso || (yo.rol === 'estudiante' && curso.estado !== 'ACTIVO')) return error(res, 404, 'Curso no encontrado');
      const detalle = { ...cursoPublico(curso), inscrito: curso.estudiantes.includes(yo.id) };
      if (yo.rol !== 'estudiante') {
        detalle.listaEstudiantes = db.usuarios
          .filter((u) => curso.estudiantes.includes(u.id))
          .map((u) => ({ id: u.id, nombre: u.nombre, email: u.email }));
      }
      return responder(res, 200, detalle);
    }

    if (metodo === 'PUT') {
      const yo = autenticar(req, res, ['admin', 'profesor']);
      if (!yo) return;
      if (!curso) return error(res, 404, 'Curso no encontrado');
      if (yo.rol === 'profesor' && curso.profesorId !== yo.id) {
        return error(res, 403, 'Solo puedes editar tus propios cursos');
      }
      const datos = { ...curso, ...cuerpo, codigo: String(cuerpo.codigo || curso.codigo).toUpperCase() };
      if (yo.rol === 'profesor') datos.profesorId = yo.id;
      datos.profesorId = Number(datos.profesorId);
      const errores = validarCurso(datos);
      if (!db.usuarios.some((u) => u.id === datos.profesorId && u.rol === 'profesor')) {
        errores.profesorId = 'Selecciona un profesor válido';
      }
      if (Number(datos.cupos) < curso.estudiantes.length) errores.cupos = 'No puede ser menor a los inscritos';
      if (Object.keys(errores).length) return error(res, 400, 'Datos inválidos', errores);
      if (db.cursos.some((c) => c.id !== id && c.codigo === datos.codigo)) {
        return error(res, 409, 'Ya existe un curso con ese código');
      }
      Object.assign(curso, {
        codigo: datos.codigo,
        nombre: String(datos.nombre).trim(),
        descripcion: String(datos.descripcion || '').trim(),
        creditos: Number(datos.creditos),
        horas: Number(datos.horas),
        profesorId: datos.profesorId,
        estado: datos.estado,
        cupos: Number(datos.cupos),
      });
      guardar();
      return responder(res, 200, cursoPublico(curso));
    }

    if (metodo === 'DELETE') {
      const yo = autenticar(req, res, ['admin']);
      if (!yo) return;
      if (!curso) return error(res, 404, 'Curso no encontrado');
      db.cursos = db.cursos.filter((c) => c.id !== id);
      guardar();
      return responder(res, 204);
    }
  }

  return error(res, 404, `Ruta no encontrada: ${metodo} ${ruta}`);
}

const servidor = http.createServer((req, res) => {
  const inicio = Date.now();
  res.on('finish', () => {
    if (!process.env.SILENCIOSO) console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - inicio} ms)`);
  });
  manejar(req, res).catch((e) => {
    console.error(e);
    error(res, 500, 'Error interno del servidor');
  });
});

servidor.listen(PORT, () => {
  console.log(`API Gestión Académica escuchando en http://localhost:${PORT}/api`);
  console.log(`Tokens JWT válidos por ${TOKEN_EXP} segundos`);
});

module.exports = servidor;
