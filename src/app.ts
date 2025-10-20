import express from 'express';
import { setMockRoutes } from './routes/mockRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Built-in Express JSON middleware
app.use(express.json());

// Set up routes
setMockRoutes(app);

// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Mock Server is running!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});