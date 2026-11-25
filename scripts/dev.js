/**
 * Levanta la API simulada y Angular con un solo comando:  npm run dev
 */
const { spawn } = require('child_process');

const procesos = [
  spawn('node api/server.js', { shell: true, stdio: 'inherit' }),
  spawn('npx ng serve -o', { shell: true, stdio: 'inherit' }),
];

const detener = () => {
  procesos.forEach((p) => p.kill());
  process.exit();
};
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
procesos.forEach((p) => p.on('exit', (codigo) => codigo && detener()));
