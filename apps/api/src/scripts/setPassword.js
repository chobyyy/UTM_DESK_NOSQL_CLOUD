require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dns = require('dns');
const { User } = require('../models/User');

const COST_FACTOR = 12;

let pipedLines = null;
let pipedIndex = 0;

async function ensurePipedLines() {
  if (pipedLines !== null) return;
  if (process.stdin.isTTY) {
    pipedLines = [];
    return;
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  pipedLines = Buffer.concat(chunks).toString().split(/\r?\n/);
}

function nextPipedLine() {
  if (!pipedLines || pipedIndex >= pipedLines.length) return '';
  const line = pipedLines[pipedIndex];
  pipedIndex += 1;
  return line;
}

function parseArgs(argv) {
  let email = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--email' || argv[i] === '-e') {
      email = argv[i + 1];
      i += 1;
    } else if (!email) {
      email = argv[i];
    }
  }
  return email;
}

async function promptText(question) {
  process.stdout.write(question);
  if (!process.stdin.isTTY) {
    await ensurePipedLines();
    const answer = nextPipedLine();
    process.stdout.write(`${answer}\n`);
    return answer;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => {
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptHidden(question) {
  process.stdout.write(question);
  if (!process.stdin.isTTY) {
    await ensurePipedLines();
    const answer = nextPipedLine();
    process.stdout.write('\n');
    return answer;
  }
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '\u0003') {
        process.stdout.write('\n');
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        if (value.length > 0) value = value.slice(0, -1);
      } else if (char >= ' ') {
        value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function connect() {
  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map((server) => server.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false });
}

async function main() {
  await ensurePipedLines();

  let email = parseArgs(process.argv.slice(2));
  if (!email) {
    email = (await promptText('Correo de la cuenta: ')).trim();
  }
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Correo no valido.');
  }

  await connect();

  const user = await User.findOne({ correo: email }).select('+password_hash');
  if (!user) {
    throw new Error('No existe una cuenta con ese correo.');
  }
  if (user.password_hash) {
    const confirmation = (await promptText('La cuenta ya tiene contrasena. Sobrescribir? (s/N): ')).trim().toLowerCase();
    if (confirmation !== 's' && confirmation !== 'si') {
      console.log('Operacion cancelada.');
      await mongoose.disconnect();
      return;
    }
  }

  const password = await promptHidden('Nueva contrasena: ');
  if (!password || password.length < 8) {
    throw new Error('La contrasena debe tener al menos 8 caracteres.');
  }
  const confirmationPassword = await promptHidden('Confirmar contrasena: ');
  if (password !== confirmationPassword) {
    throw new Error('Las contrasenas no coinciden.');
  }

  const hash = await bcrypt.hash(password, COST_FACTOR);

  const updateResult = await User.updateOne({ _id: user._id }, { $set: { password_hash: hash } });
  if (!updateResult.matchedCount) throw new Error('No se pudo actualizar la cuenta.');
  console.log(`Contrasena configurada para ${email}.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Error: ${error.message}`);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});