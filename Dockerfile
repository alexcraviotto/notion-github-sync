# Usar una imagen base de Node.js LTS
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./
COPY .env ./

# Instalar dependencias
run npm install

# Copiar código fuente
COPY . .

# Configurar comando de inicio
CMD [ "node", "index.js" ]