# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies for image optimization
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --production=false && \
    npm cache clean --force

# Copy the rest of the code
COPY . .

# Set environment variables for production build
ENV VITE_API_URL=https://api.indowater.com/api/v1
ENV VITE_USE_MOCK_API=false
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_ENV=production

# Build the app with production optimizations
RUN npm run optimize:images && \
    npm run build:prod

# Production stage
FROM nginx:alpine

# Install required packages
RUN apk add --no-cache brotli

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Create Brotli compressed versions of static assets
RUN find /usr/share/nginx/html -type f -regex ".*\.\(js\|css\|svg\|json\)$" -exec brotli -f {} \;

# Create gzip compressed versions of static assets
RUN find /usr/share/nginx/html -type f -regex ".*\.\(js\|css\|svg\|json\)$" -exec gzip -f -k {} \;

# Add security headers
RUN echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-Frame-Options "SAMEORIGIN";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header Referrer-Policy "strict-origin-when-cross-origin";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:; connect-src \'self\' https://api.indowater.com";' >> /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]