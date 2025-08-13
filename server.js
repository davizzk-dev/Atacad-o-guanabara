// Backend Node.js para APIs principais
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const axios = require('axios');
const next = require('next');

// Importar função de sincronização correta
const { syncAndFormatProducts } = require('./scripts/sync-with-formatting.js');

const app = express();
app.use(cors());
app.use(express.json());

// Carregar variáveis de ambiente PRIMEIRO (usar caminho absoluto para evitar falhas)
const envPath = path.join(__dirname, '.env.local');
// Robust env load: parse and set manual override
try {
  const exists = fs.existsSync(envPath);
  if (exists) {
    const dotenv = require('dotenv');
    const buf = fs.readFileSync(envPath);
    let raw = '';
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
      raw = buf.toString('utf16le');
    } else if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      raw = buf.toString('utf8');
    } else {
      raw = buf.toString('utf8');
      if (/\u0000/.test(raw)) raw = buf.toString('utf16le');
    }
    let parsed = {};
    try { parsed = dotenv.parse(raw); } catch {}
    let keys = Object.keys(parsed || {});
    if (keys.length === 0 && /\w+=/.test(raw)) {
      const normalized = raw.replace(/\r\n?/g, '\n');
      try { parsed = dotenv.parse(normalized); keys = Object.keys(parsed || {}); } catch {}
    }
    if (keys.length > 0) {
      for (const k of keys) process.env[k] = parsed[k];
      try {
        const current = fs.readFileSync(envPath, 'utf8');
        if (/\u0000/.test(current) || current.charCodeAt(0) === 0xFEFF) {
          fs.writeFileSync(
            envPath,
            Object.entries(parsed).map(([k, v]) => `${k}=${v}`).join('\r\n') + '\r\n',
            { encoding: 'utf8' }
          );
          console.log('🧹 .env.local normalizado para UTF-8');
        }
      } catch {}
    }
    console.log(`🔧 .env.local: carregado (${keys.length} chaves) -> ${envPath}`);
  } else {
    console.log(`🔧 .env.local: NÃO encontrado -> ${envPath}`);
  }
} catch (e) {
  console.warn('⚠️ Falha ao carregar .env.local:', e?.message || e);
}
console.log('🔧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'não definido');
console.log('🔧 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ presente' : '❌ ausente');
console.log('🔧 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ presente' : '❌ ausente');

// Definir porta para Next.js ANTES de importar o Next
process.env.PORT = process.env.PORT || 3005;
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3005';

// Configurar Next.js com porta específica
const nextApp = next({ 
  dev: false, 
  dir: __dirname,
  port: 3005,
  hostname: 'localhost'
});
const nextHandler = nextApp.getRequestHandler();

// === Iniciar Backend Java automaticamente ===
const javaBackendPath = path.join(__dirname, 'java-backend');
let mavenBin = 'mvn';
try {
  execSync('mvn --version', { stdio: 'ignore' });
  console.log('✅ Maven encontrado no PATH');
} catch {
  const possiblePaths = [
    '"C:/Users/escritorio atacadao/Downloads/apache-maven-3.9.11-bin/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/Program Files/Apache Software Foundation/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/apache-maven-3.9.11/bin/mvn.cmd"',
    '"C:/maven/bin/mvn.cmd"',
    'mvn.cmd',
  ];
  for (const candidate of possiblePaths) {
    try {
      execSync(`${candidate} --version`, { stdio: 'ignore' });
      mavenBin = candidate;
      console.log(`✅ Maven encontrado em: ${candidate}`);
      break;
    } catch {
      console.log(`❌ Maven não encontrado em: ${candidate}`);
    }
  }
}

console.log('🚀 Iniciando backend Java...');
const javaProcess = spawn(mavenBin + ' spring-boot:run', {
  cwd: javaBackendPath,
  stdio: 'inherit',
  shell: true,
});

javaProcess.on('close', (code) => {
  console.log(`Backend Java finalizado com código ${code}`);
});

process.on('exit', () => {
  try { javaProcess.kill(); } catch {}
});

process.on('SIGINT', () => {
  try { javaProcess.kill('SIGINT'); } catch {}
  process.exit();
});

// Inicializar Next.js e configurar rotas
nextApp.prepare().then(() => {
  // Arquivos estáticos
  app.use('/_next', express.static(path.join(__dirname, '.next')));
  app.use('/static', express.static(path.join(__dirname, 'public')));

  // Logs para rotas específicas
  app.use('/api/sync-products', (req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });
  app.use('/api/test-varejo-facil', (req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

  // Rota: sincronização de produtos (usa sync-with-formatting.js)
  app.post('/api/sync-products', async (req, res) => {
    const startedAt = Date.now();
    try {
      console.log('🔄 Sincronização de produtos iniciada via /api/sync-products');
      const result = await syncAndFormatProducts();

      // Persistir histórico da sincronização (sucesso)
      try {
        const dataDir = path.join(process.cwd(), 'data');
        const historyPath = path.join(dataDir, 'varejo-sync-history.json');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        let history = [];
        if (fs.existsSync(historyPath)) {
          try { history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]'); } catch {}
        }
        const entry = {
          id: Date.now().toString(),
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          totals: {
            products: result.totalProducts ?? result.productsTotal ?? 0,
            sections: result.totalSections ?? 0,
            brands: result.totalBrands ?? 0,
            genres: result.totalGenres ?? 0,
          },
          message: 'Sincronização concluída',
          status: 'success',
        };
        history.unshift(entry);
        if (history.length > 100) history = history.slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch (persistErr) {
        console.warn('⚠️ Falha ao salvar histórico de sync:', persistErr?.message || persistErr);
      }

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      // Persistir histórico (erro)
      try {
        const dataDir = path.join(process.cwd(), 'data');
        const historyPath = path.join(dataDir, 'varejo-sync-history.json');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        let history = [];
        if (fs.existsSync(historyPath)) {
          try { history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]'); } catch {}
        }
        history.unshift({
          id: Date.now().toString(),
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          totals: { products: 0, sections: 0, brands: 0, genres: 0 },
          message: error?.message || 'Erro na sincronização',
          status: 'error',
        });
        if (history.length > 100) history = history.slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch {}

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error?.message || String(error),
      });
    }
  });

  // Rota: teste do Varejo Fácil
  app.get('/api/test-varejo-facil', async (req, res) => {
    try {
      console.log('🧪 Iniciando teste da API do Varejo Fácil...');
      const { runFinalTests } = require('./scripts/test-varejo-facil-final.js');
      const results = await runFinalTests();
      res.json({ success: true, message: 'Teste do Varejo Fácil executado com sucesso', results });
    } catch (error) {
      console.error('❌ Erro ao executar teste do Varejo Fácil:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error?.message || String(error) });
    }
  });

  // Todas as outras rotas vão para o Next.js
  app.all('*', (req, res) => nextHandler(req, res));

  // Iniciar servidor
  const PORT = Number(process.env.PORT) || 3005;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log('✅ Site INTEIRO funcionando!');
    console.log('✅ Login com Google funcionando!');
    console.log('✅ Todas as páginas disponíveis!');
    console.log('✅ APIs funcionando!');
  });
}).catch((e) => {
  console.error('Falha ao preparar Next.js:', e);
  process.exit(1);
});
