# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Install Python and other build dependencies required for node-gyp
RUN apk add --no-cache python3 make g++ && ln -sf python3 /usr/bin/python

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Create the final image for running the application
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your app (specify the entry script)
CMD ["node", "dist/main"]

