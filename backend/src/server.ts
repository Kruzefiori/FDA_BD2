// src/server.ts
import express from 'express';
import userRoutes from './routes/userRoutes';

const app = express();
app.use(express.json());

app.use('/user', userRoutes); // Prefixo para as rotas de usuários
app.use('/teste', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
