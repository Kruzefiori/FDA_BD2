// src/server.ts
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import drugRoutes from './routes/drugRoutes';

const app = express();

// 🔓 Permite requisições de qualquer origem (pode restringir no futuro se quiser)
app.use(cors());

// 📦 Interpreta JSON automaticamente
app.use(express.json());

// 📌 Suas rotas
app.use('/user', userRoutes);
app.use('/drug', drugRoutes);

app.use('/teste', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// 🚀 Faz o servidor escutar em 0.0.0.0 para permitir acesso externo
app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando em http://0.0.0.0:3000');
});
