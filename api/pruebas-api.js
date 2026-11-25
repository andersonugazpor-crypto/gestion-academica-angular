/**
 * Pruebas funcionales de la API REST.
 * Levanta el servidor en un puerto aparte, con una copia temporal de los datos
 * y tokens de 3 segundos (para probar la expiración), y ejecuta cada caso.
 *
 * Uso: node api/pruebas-api.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 3999;
const BASE = `http://localhost:${PORT}/api`;
const DB_TMP = path.join(os.tmpdir(), `db-pruebas-${Date.now()}.json`);
fs.copyFileSync(path.join(__dirname, 'db.seed.json'), DB_TMP);

const servidor = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
  env: { ...process.env, PORT, TOKEN_EXP: 3, DB_FILE: DB_TMP, SILENCIOSO: '1' },
  stdio: ['ignore', 'pipe', 'inherit'],
});

const resultados = [];
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(metodo, ruta, { token, body } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  return { status: res.status, data: texto ? JSON.parse(texto) : null };
}

async function caso(id, descripcion, fn, esperado) {
  let ok = false;
  let obtenido = '';
  try {
    const r = await fn();
    obtenido = r.detalle || String(r.status);
    ok = r.ok;
  } catch (e) {
    obtenido = 'Excepción: ' + e.message;
  }
  resultados.push({ id, descripcion, esperado, obtenido, ok });
  console.log(`${ok ? 'PASA' : 'FALLA'}  ${id}  ${descripcion}  -> ${obtenido}`);
}

async function ejecutar() {
  await esperar(500);
  const login = (email, password) => pedir('POST', '/auth/login', { body: { email, password } });

  let tokenAdmin, tokenProfe, tokenEstu, idCurso, idUsuario;

  await caso('API-01', 'Login de administrador con credenciales válidas', async () => {
    const r = await login('admin@idat.edu.pe', 'admin123');
    tokenAdmin = r.data.token;
    const partes = (tokenAdmin || '').split('.').length;
    return { ok: r.status === 200 && partes === 3 && r.data.usuario.rol === 'admin', detalle: `${r.status}, JWT de ${partes} partes, rol ${r.data.usuario.rol}` };
  }, '200 y token JWT');

  await caso('API-02', 'Login con contraseña incorrecta', async () => {
    const r = await login('admin@idat.edu.pe', 'malaclave');
    return { ok: r.status === 401, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '401 Credenciales incorrectas');

  await caso('API-03', 'Login de profesor y estudiante', async () => {
    const p = await login('profesor@idat.edu.pe', 'profe123');
    const e = await login('estudiante@idat.edu.pe', 'estu123');
    tokenProfe = p.data.token;
    tokenEstu = e.data.token;
    return { ok: p.status === 200 && e.status === 200, detalle: `${p.status} (${p.data.usuario.rol}), ${e.status} (${e.data.usuario.rol})` };
  }, '200 en ambos');

  await caso('API-04', 'GET /cursos sin token', async () => {
    const r = await pedir('GET', '/cursos');
    return { ok: r.status === 401, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '401');

  await caso('API-05', 'GET /cursos con token manipulado', async () => {
    const t = tokenAdmin.slice(0, -3) + 'abc';
    const r = await pedir('GET', '/cursos', { token: t });
    return { ok: r.status === 401, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '401 firma inválida');

  await caso('API-06', 'GET /cursos como administrador', async () => {
    const r = await pedir('GET', '/cursos', { token: tokenAdmin });
    return { ok: r.status === 200 && r.data.length === 4, detalle: `${r.status}, ${r.data.length} cursos` };
  }, '200 con 4 cursos');

  await caso('API-07', 'GET /cursos como estudiante (solo activos)', async () => {
    const r = await pedir('GET', '/cursos', { token: tokenEstu });
    const todosActivos = r.data.every((c) => c.estado === 'ACTIVO');
    return { ok: r.status === 200 && r.data.length === 3 && todosActivos, detalle: `${r.status}, ${r.data.length} cursos activos` };
  }, '200 con 3 cursos');

  await caso('API-08', 'POST /cursos como administrador', async () => {
    const r = await pedir('POST', '/cursos', {
      token: tokenAdmin,
      body: { codigo: 'WEB-301', nombre: 'Desarrollo Web Avanzado', descripcion: 'SPA con Angular', creditos: 4, horas: 64, cupos: 30, estado: 'ACTIVO', profesorId: 2 },
    });
    idCurso = r.data.id;
    return { ok: r.status === 201 && !!idCurso, detalle: `${r.status}, id ${idCurso}, profesor ${r.data.profesorNombre}` };
  }, '201 curso creado');

  await caso('API-09', 'POST /cursos con datos inválidos', async () => {
    const r = await pedir('POST', '/cursos', { token: tokenAdmin, body: { codigo: 'x', nombre: '', creditos: 9 } });
    return { ok: r.status === 400 && !!r.data.errores, detalle: `${r.status}, campos: ${Object.keys(r.data.errores || {}).join(', ')}` };
  }, '400 con errores por campo');

  await caso('API-10', 'POST /cursos con código duplicado', async () => {
    const r = await pedir('POST', '/cursos', {
      token: tokenAdmin,
      body: { codigo: 'WEB-301', nombre: 'Duplicado', creditos: 3, horas: 48, cupos: 20, estado: 'ACTIVO', profesorId: 2 },
    });
    return { ok: r.status === 409, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '409');

  await caso('API-11', 'PUT /cursos/:id como profesor dueño', async () => {
    const r = await pedir('PUT', `/cursos/${idCurso}`, { token: tokenProfe, body: { nombre: 'Desarrollo Web Avanzado II', cupos: 25 } });
    return { ok: r.status === 200 && r.data.nombre === 'Desarrollo Web Avanzado II', detalle: `${r.status}, nombre "${r.data.nombre}"` };
  }, '200 curso actualizado');

  await caso('API-12', 'PUT /cursos/2 como profesor que no es dueño', async () => {
    const r = await pedir('PUT', '/cursos/2', { token: tokenProfe, body: { nombre: 'Intento' } });
    return { ok: r.status === 403, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '403');

  await caso('API-13', 'POST /cursos como estudiante', async () => {
    const r = await pedir('POST', '/cursos', { token: tokenEstu, body: { codigo: 'EST-1' } });
    return { ok: r.status === 403, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '403');

  await caso('API-14', 'Inscripción de estudiante en curso nuevo', async () => {
    const r = await pedir('POST', `/cursos/${idCurso}/inscripcion`, { token: tokenEstu });
    const r2 = await pedir('POST', `/cursos/${idCurso}/inscripcion`, { token: tokenEstu });
    return { ok: r.status === 201 && r2.status === 409, detalle: `${r.status} inscrito; repetir: ${r2.status}` };
  }, '201 y luego 409');

  await caso('API-15', 'GET /usuarios como profesor', async () => {
    const r = await pedir('GET', '/usuarios', { token: tokenProfe });
    return { ok: r.status === 403, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '403 (solo admin)');

  await caso('API-16', 'GET /usuarios como administrador (sin contraseñas)', async () => {
    const r = await pedir('GET', '/usuarios', { token: tokenAdmin });
    const sinHash = r.data.every((u) => !('passwordHash' in u) && !('salt' in u));
    return { ok: r.status === 200 && r.data.length === 6 && sinHash, detalle: `${r.status}, ${r.data.length} usuarios, sin hash: ${sinHash}` };
  }, '200 con 6 usuarios');

  await caso('API-17', 'POST /usuarios (crear estudiante)', async () => {
    const r = await pedir('POST', '/usuarios', {
      token: tokenAdmin,
      body: { nombre: 'Pedro Castillo Rojas', email: 'pcastillo@idat.edu.pe', password: 'clave123', rol: 'estudiante' },
    });
    idUsuario = r.data.id;
    return { ok: r.status === 201, detalle: `${r.status}, id ${idUsuario}` };
  }, '201');

  await caso('API-18', 'POST /usuarios con correo repetido', async () => {
    const r = await pedir('POST', '/usuarios', {
      token: tokenAdmin,
      body: { nombre: 'Otro', email: 'pcastillo@idat.edu.pe', password: 'clave123', rol: 'estudiante' },
    });
    return { ok: r.status === 409, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '409');

  await caso('API-19', 'PUT /usuarios/:id (cambiar a profesor)', async () => {
    const r = await pedir('PUT', `/usuarios/${idUsuario}`, { token: tokenAdmin, body: { rol: 'profesor' } });
    return { ok: r.status === 200 && r.data.rol === 'profesor', detalle: `${r.status}, rol ${r.data.rol}` };
  }, '200');

  await caso('API-20', 'Login del usuario creado', async () => {
    const r = await login('pcastillo@idat.edu.pe', 'clave123');
    return { ok: r.status === 200 && r.data.usuario.rol === 'profesor', detalle: `${r.status}, rol ${r.data.usuario.rol}` };
  }, '200');

  await caso('API-21', 'DELETE /usuarios/:id', async () => {
    const r = await pedir('DELETE', `/usuarios/${idUsuario}`, { token: tokenAdmin });
    const r2 = await pedir('GET', `/usuarios/${idUsuario}`, { token: tokenAdmin });
    return { ok: r.status === 204 && r2.status === 404, detalle: `${r.status}; luego GET: ${r2.status}` };
  }, '204 y luego 404');

  await caso('API-22', 'DELETE /usuarios/1 (el admin a sí mismo)', async () => {
    const r = await pedir('DELETE', '/usuarios/1', { token: tokenAdmin });
    return { ok: r.status === 400, detalle: `${r.status} "${r.data.mensaje}"` };
  }, '400');

  await caso('API-23', 'DELETE /cursos/:id como administrador', async () => {
    const r = await pedir('DELETE', `/cursos/${idCurso}`, { token: tokenAdmin });
    const r2 = await pedir('GET', `/cursos/${idCurso}`, { token: tokenAdmin });
    return { ok: r.status === 204 && r2.status === 404, detalle: `${r.status}; luego GET: ${r2.status}` };
  }, '204 y luego 404');

  await caso('API-24', 'GET /estadisticas según rol', async () => {
    const a = await pedir('GET', '/estadisticas', { token: tokenAdmin });
    const p = await pedir('GET', '/estadisticas', { token: tokenProfe });
    const e = await pedir('GET', '/estadisticas', { token: tokenEstu });
    const ok = 'totalUsuarios' in a.data && 'misCursos' in p.data && 'cursosInscritos' in e.data;
    return { ok, detalle: `admin: ${a.data.totalUsuarios} usuarios; profesor: ${p.data.misCursos} cursos; estudiante: ${e.data.cursosInscritos} inscritos` };
  }, 'Datos distintos por rol');

  await caso('API-25', 'Token expirado (vida de 3 s)', async () => {
    const r0 = await login('admin@idat.edu.pe', 'admin123');
    await esperar(4200);
    const r = await pedir('GET', '/cursos', { token: r0.data.token });
    return { ok: r.status === 401 && r.data.mensaje === 'Token expirado', detalle: `${r.status} "${r.data.mensaje}"` };
  }, '401 Token expirado');

  const pasan = resultados.filter((r) => r.ok).length;
  console.log(`\n${pasan} de ${resultados.length} pruebas pasaron.`);
  fs.writeFileSync(path.join(__dirname, 'resultados-pruebas.json'), JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2));
  return pasan === resultados.length;
}

ejecutar()
  .then((todo) => {
    servidor.kill();
    fs.rmSync(DB_TMP, { force: true });
    process.exit(todo ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    servidor.kill();
    process.exit(1);
  });
