# Use an official Node.js runtime as a base image
FROM node:16.14-slim

# Set the working directory
WORKDIR /app

# Copy package.json, pnpm-lock.yaml (or pnpmfile.js), and .pnp.js
COPY package*.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Install necessary dependencies for Puppeteer
RUN apk --no-cache add chromium

# Set the Puppeteer executable path to the installed Chromium package
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install a specific version of Puppeteer that works with Chromium 100
RUN pnpm add puppeteer@13.5.0

# Add user so we don't need --no-sandbox
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads

# Copy the rest of the application code
COPY . .

# Expose the port your application is running on
EXPOSE 3001

# Command to run your application
CMD ["pnpm", "start"]
