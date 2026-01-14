# Dockerisation Angular - Pharmacie Frontend

## 🐳 Fichiers Docker créés

- `Dockerfile` - Build multi-stage optimisé
- `nginx.conf` - Configuration Nginx pour SPA Angular
- `.dockerignore` - Exclusion des fichiers inutiles

## 🚀 Build & Run

### Build l'image Docker
```bash
docker build -t pharmacie-frontend .
```

### Lancer le container
```bash
docker run -p 80:80 pharmacie-frontend
```

### Accéder à l'application
Ouvrez votre navigateur sur: `http://localhost`

## 📋 Commandes utiles

### Vérifier l'image
```bash
docker images | grep pharmacie-frontend
```

### Vérifier les containers
```bash
docker ps
```

### Logs du container
```bash
docker logs <container_id>
```

### Arrêter le container
```bash
docker stop <container_id>
```

### Supprimer l'image
```bash
docker rmi pharmacie-frontend
```

## 🔧 Configuration

### Port personnalisé
```bash
docker run -p 8080:80 pharmacie-frontend
```

### Mode détaché (background)
```bash
docker run -d -p 80:80 --name pharmacie-app pharmacie-frontend
```

### Volume pour les logs
```bash
docker run -d -p 80:80 -v nginx-logs:/var/log/nginx pharmacie-frontend
```

## 🌐 Configuration API

Si votre backend est sur une URL différente, décommentez et modifiez la section `proxy` dans `nginx.conf`:

```nginx
location /api/ {
    proxy_pass http://votre-backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📊 Caractéristiques

- ✅ **Multi-stage build** - Image finale légère (~25MB)
- ✅ **Nginx Alpine** - Serveur web optimisé
- ✅ **SPA Routing** - Support des routes Angular
- ✅ **Gzip compression** - Optimisation des performances
- ✅ **Cache static** - Mise en cache des assets
- ✅ **Security headers** - En-têtes de sécurité
- ✅ **Health check** - Endpoint `/health`

## 🔒 Sécurité

- Image Alpine basée sur Alpine Linux
- Pas de secrets dans l'image
- Headers de sécurité configurés
- Cache immutable pour les assets statiques

## 🚀 Déploiement

### VPS/Cloud
```bash
# Sur le serveur
docker build -t pharmacie-frontend .
docker run -d -p 80:80 --name pharmacie-app --restart unless-stopped pharmacie-frontend
```

### Production avec HTTPS
Utilisez un reverse proxy (Traefik, Nginx Proxy Manager) ou configurez SSL directement dans Nginx.

## 🐛 Débogage

### Vérifier la configuration Nginx
```bash
docker run -it --rm pharmacie-frontend nginx -t
```

### Shell dans le container
```bash
docker run -it --rm pharmacie-frontend sh
```

### Vérifier les fichiers build
```bash
docker run -it --rm pharmacie-frontend ls -la /usr/share/nginx/html
```

## 📝 Notes

- L'application Angular est buildée en mode production
- Les assets sont servis avec cache 1an (immutable)
- Les routes Angular sont gérées par `try_files $uri $uri/ /index.html`
- Le container écoute sur le port 80 par défaut
