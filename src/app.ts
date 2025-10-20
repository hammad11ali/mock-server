import express from 'express';
import { DynamicMockController } from './controllers/mockController';
import { setMockRoutes } from './routes/mockRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Built-in Express JSON middleware
app.use(express.json());

// Initialize dynamic mock controller
const dynamicMockController = new DynamicMockController();

async function startServer() {
    try {
        // Initialize the dynamic mock system
        await dynamicMockController.initialize();

        // Health check endpoint
        app.get('/', dynamicMockController.healthCheck.bind(dynamicMockController));

        // Set up legacy routes (for backward compatibility)
        setMockRoutes(app);

        // Dynamic mock system - catch all API routes
        app.use('/api/*', ...dynamicMockController.getMiddleware());

        // 404 handler for unmatched routes
        app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: `No route found for ${req.method} ${req.path}`,
                availableEndpoints: {
                    health: 'GET /',
                    legacy: 'GET /api/mock-data',
                    dynamic: 'GET|POST|PUT|DELETE /api/*'
                }
            });
        });

        // Global error handler
        app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('❌ Global error handler:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message || 'Something went wrong'
            });
        });

        app.listen(PORT, () => {
            console.log('🚀 Dynamic Mock Server started successfully!');
            console.log(`📍 Server running on: http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/`);
            console.log(`📊 Legacy API: http://localhost:${PORT}/api/mock-data`);
            console.log(`🔄 Dynamic APIs: http://localhost:${PORT}/api/*`);
            console.log('');
            console.log('✨ Available dynamic endpoints:');
            console.log('   GET  /api/users - List all users');
            console.log('   GET  /api/users/:id - Get user by ID');
            console.log('   POST /api/users - Create new user');
            console.log('   GET  /api/products - List all products');
            console.log('');
            console.log('🔧 Hot-reload enabled for config changes');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();