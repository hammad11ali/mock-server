import express from 'express';
import { DocsController } from './controllers/docsController';
import { DynamicMockController } from './controllers/mockController';
import adminRouter from './routes/adminRouter';

const app = express();
const PORT = process.env.PORT || 3000;

// Built-in Express JSON middleware
app.use(express.json());

// Initialize controllers
const dynamicMockController = new DynamicMockController();
const docsController = new DocsController();

async function startServer() {
    try {
        // Initialize the dynamic mock system
        await dynamicMockController.initialize();

        // Health check endpoint
        app.get('/', dynamicMockController.healthCheck.bind(dynamicMockController));

        // Documentation routes
        app.get('/docs', docsController.getDocsIndex.bind(docsController));
        app.get('/docs/readme', docsController.getReadme.bind(docsController));
        app.get('/docs/quick', docsController.getQuickReference.bind(docsController));
        app.get('/docs/guide', docsController.getMockGuide.bind(docsController));

        // Admin interface routes
        app.use('/admin', adminRouter);

        // Dynamic mock system - catch all API routes
        app.use('/api', ...dynamicMockController.getMiddleware());

        // 404 handler for unmatched routes
        app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: `No route found for ${req.method} ${req.path}`,
                availableEndpoints: {
                    health: 'GET /',
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
            console.log(`🔧 Admin interface: http://localhost:${PORT}/admin`);
            console.log(`📡 Dynamic APIs: http://localhost:${PORT}/api/*`);
            console.log('');
            console.log('✨ Available dynamic endpoints:');
            
            // Dynamically load and display all configured routes
            const routeConfigs = dynamicMockController['configLoader'].getAllRouteConfigs();
            routeConfigs.forEach(config => {
                console.log(`   ${config.method.padEnd(6)} /api${config.path}`);
            });
            
            console.log('');
            console.log('� Documentation endpoints:');
            console.log('   GET  /docs - Documentation index');
            console.log('   GET  /docs/readme - Full README');
            console.log('   GET  /docs/quick - Quick reference');
            console.log('   GET  /docs/guide - Mock creation guide');
            console.log('');
            console.log('�🔧 Admin endpoints:');
            console.log('   GET  /admin/files - List all configuration files');
            console.log('   POST /admin/files/upload - Upload new configuration files');
            console.log('   GET  /admin/files/download/* - Download specific file');
            console.log('   DELETE /admin/files/* - Delete specific file');
            console.log('   POST /admin/refresh - Refresh server configurations');
            console.log('   GET  /admin/status - Get server status');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();