require('dotenv').config();

// Vérification des variables d'environnement critiques
const REQUIRED_ENV = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`[ERREUR DÉMARRAGE] Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
  console.error('Vérifiez votre fichier .env');
  process.exit(1);
}

const path    = require('path');
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const seedAdmin = require('./utils/seed');

const authRoutes = require('./routes/auth');
const visitorRoutes = require('./routes/visitors');
const visitRoutes = require('./routes/visits');
const gateRoutes = require('./routes/gate');
const receptionRoutes = require('./routes/reception');
const reportRoutes    = require('./routes/reports');
const signatureRoutes = require('./routes/signature');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Global rate limit
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Inject socket.io into requests
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/auth', authRoutes);
app.use('/visitors', visitorRoutes);
app.use('/visits', visitRoutes);
app.use('/gate', gateRoutes);
app.use('/reception', receptionRoutes);
app.use('/reports',   reportRoutes);
app.use('/signature', signatureRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route non trouvée' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur interne', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Socket connecté : ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket déconnecté : ${socket.id}`));
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL établie.');
    await sequelize.sync({ alter: true });
    console.log('Modèles synchronisés.');
    await seedAdmin();
    server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
  } catch (err) {
    console.error('Erreur démarrage :', err);
    process.exit(1);
  }
};

start();
