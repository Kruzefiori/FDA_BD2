# Etapa de construção
FROM node:18 AS build

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar arquivos do projeto para dentro do container
COPY package*.json ./
RUN npm install

# Copiar o restante dos arquivos
COPY . .

# Compilar o código Typescript
RUN npm run build

# Etapa de execução
FROM node:18

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar dependências e arquivos compilados da etapa de construção
COPY --from=build /app /app

# Expor a porta que o backend vai rodar
EXPOSE 3000

# Comando para rodar o servidor
CMD ["npm", "run", "dev"]
