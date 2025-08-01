# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Set environment variables for production build
ENV REACT_APP_API_URL=https://api.indowater.com/api/v1
ENV REACT_APP_USE_MOCK_API=false
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_ENV=production

# Run optimizations and build
RUN npm run lint:fix && \
    npm run format && \
    npm run optimize:images && \
    npm run build

# Production stage
FROM nginx:alpine

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]