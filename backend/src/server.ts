// src/server.ts
import express from 'express';
import userRoutes from './routes/userRoutes';
import drugRoutes from './routes/drugRoutes';

const app = express();
app.use(express.json());

app.use('/user', userRoutes); // Prefixo para as rotas de usuários
app.use('/drug', drugRoutes); // Prefixo para as rotas de medicamentos
app.use('/teste', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
