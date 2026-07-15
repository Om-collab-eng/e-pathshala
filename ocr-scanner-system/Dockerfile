# Use official Node.js 20 LTS image
FROM node:20

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5002

# Set work directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 5002

# Start the application
CMD ["npm", "start"]
