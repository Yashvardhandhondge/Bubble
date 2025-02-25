# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install dependencies
RUN npm install

# Expose the application's port (default 3000 but can be overridden)
ARG PORT=5173
ENV PORT=${PORT}

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Use entrypoint script for container start
ENTRYPOINT ["/app/entrypoint.sh"]