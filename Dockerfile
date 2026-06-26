# =============================================================================
# STSS Frontend — Multi-stage Docker Build
# Vue 3 + Vite 5 SPA → Static files served by Nginx
# =============================================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

# Enable corepack so pnpm version from package.json is used automatically
RUN corepack enable

WORKDIR /app

# Copy dependency manifests first (cache layer)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build-time argument — override API URL if needed (default: same-origin)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build for production (vue-tsc type-check + vite build)
RUN pnpm build:pro

# ---- Stage 2: Serve ----
FROM nginx:alpine

# Remove default Nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
