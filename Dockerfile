FROM node:22-alpine AS build

WORKDIR /app

# Install root deps
COPY package*.json ./
RUN npm ci --ignore-scripts

# Install backend deps
COPY backend/package*.json backend/
RUN npm ci --prefix backend --ignore-scripts

# Install + build frontend
COPY frontend/package*.json frontend/
RUN npm ci --prefix frontend --ignore-scripts
COPY frontend/ frontend/
RUN npm run build --prefix frontend

# --- Production image ---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json backend/
RUN npm ci --prefix backend --omit=dev --ignore-scripts

COPY backend/src backend/src
COPY --from=build /app/frontend/dist frontend/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
