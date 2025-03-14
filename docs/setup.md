# Setup Instructions

## Frontend (Angular)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   ng serve
   ```

4. Access the application at `http://localhost:4200`

## Backend (Node.js)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables by copying the example:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. The API will be available at `http://localhost:3000`

## Redis Setup

1. Install Redis:
   - **Linux**: `sudo apt install redis-server`
   - **macOS**: `brew install redis`
   - **Windows**: Download from [Redis Windows](https://github.com/tporadowski/redis/releases)

2. Start Redis:
   - **Linux/macOS**: `redis-server`
   - **Windows**: Start the Redis service

3. Verify Redis is running:
   ```
   redis-cli ping
   ```
   Should return `PONG`

## AI Assistant Setup

1. Obtain API keys for your chosen AI service (OpenAI, Anthropic, etc.)

2. Add your keys to the `.env` file in the backend directory:
   ```
   AI_API_KEY=your_api_key_here
   AI_SERVICE=openai  # or anthropic, etc.
   ```

3. The AI chat integration will be available at `/api/chat` endpoint

## Docker Deployment (Optional)

1. Build the images:
   ```
   docker-compose build
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

3. Access the application at `http://localhost`

## SSL Configuration (Production)

For production deployment, set up SSL certificates:

1. Obtain SSL certificates (e.g., using Let's Encrypt)

2. Configure the web server (nginx) to use the certificates

3. Update the `.env` file with:
   ```
   USE_SSL=true
   SSL_CERT_PATH=/path/to/certificate
   SSL_KEY_PATH=/path/to/key
   ```
