# Stage 1: Build the NestJS application
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Create the final image for running the application
FROM node:18

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment variables if required 
ENV PORT=3000
ENV DB_TYPE=postgres
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=admin
ENV DB_DATABASE_NAME=postgres
ENV JWT_SECRET=mysecret
ENV JWT_EXPIRE=216000

# Expose the application port (change if your NestJS app uses a different port)
EXPOSE 3000

# Define the default command to run your NestJS application
CMD ["node", "dist/main.js"]
