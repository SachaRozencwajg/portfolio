# Utilise nginx alpine pour servir les fichiers statiques
FROM nginx:alpine

# Supprime la configuration par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copie la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copie tous les fichiers du site dans le répertoire nginx
COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js

# Copie les images
COPY photo-sacha.jpg /usr/share/nginx/html/
COPY logo-aphp.png /usr/share/nginx/html/
COPY logo-hml.jpg /usr/share/nginx/html/
COPY logo-paris-cite.png /usr/share/nginx/html/
COPY logo-paris-saclay.png /usr/share/nginx/html/
COPY logo-pulsecare.png /usr/share/nginx/html/
COPY logo-sorbonne.png /usr/share/nginx/html/
COPY logo-teamdoc.png /usr/share/nginx/html/

# S'assurer que nginx peut lire les fichiers
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose le port 8080 (requis par Cloud Run)
EXPOSE 8080

# Démarre nginx
CMD ["nginx", "-g", "daemon off;"]
