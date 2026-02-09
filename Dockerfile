# Utilise nginx alpine pour servir les fichiers statiques
# Stage 1: Build the Serious Game React App
FROM node:18-alpine as build-react
WORKDIR /app
COPY serious-game/package.json serious-game/package-lock.json* ./
RUN npm install
COPY serious-game/ .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Supprime la configuration par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copie la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copie tous les fichiers du site dans le répertoire nginx
COPY index.html /usr/share/nginx/html/
COPY 404.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/

# Copie toutes les images (jpg, png, webp)
COPY *.jpg *.png *.webp /usr/share/nginx/html/

# Copy built React app to a subdirectory
COPY --from=build-react /app/dist /usr/share/nginx/html/serious-game

# S'assurer que nginx peut lire les fichiers
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose le port 8080 (requis par Cloud Run)
EXPOSE 8080

# Démarre nginx
CMD ["nginx", "-g", "daemon off;"]
