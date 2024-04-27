# Use the official Node.js 16 image as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install project dependencies
RUN npm install && npm install sharp

# Copy the rest of your project
COPY . .

# Build your Next.js application
RUN npm run build

# Define the network port that this container will listen on at runtime
EXPOSE 3002

# Define the command to run your app using CMD which defines your runtime
CMD ["npm", "start"]
