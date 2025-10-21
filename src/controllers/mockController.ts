import { Request, Response } from 'express';
import * as path from 'path';
import { RequestMatcher } from '../middleware/requestMatcher';
import { ResponseProcessor } from '../middleware/responseProcessor';
import { ConfigLoader } from '../utils/configLoader';

export class DynamicMockController {
  private configLoader: ConfigLoader;
  private requestMatcher: RequestMatcher;
  private responseProcessor: ResponseProcessor;

  constructor() {
    const configDir = path.join(__dirname, '..', 'config');
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Use the singleton instance to ensure admin routes can access it
    this.configLoader = ConfigLoader.getInstance(configDir, dataDir);
    this.requestMatcher = new RequestMatcher(this.configLoader);
    this.responseProcessor = new ResponseProcessor(this.configLoader, dataDir);
  }

  async initialize(): Promise<void> {
    await this.configLoader.initialize();
    console.log('🚀 Dynamic Mock Controller initialized');
  }

  getMiddleware() {
    return [
      this.requestMatcher.middleware(),
      this.responseProcessor.middleware()
    ];
  }

  // Health check endpoint
  healthCheck(req: Request, res: Response) {
    const globalConfig = this.configLoader.getGlobalConfig();
    const routeConfigs = this.configLoader.getAllRouteConfigs();
    
    res.json({
      status: 'healthy',
      message: 'Dynamic Mock Server is running',
      timestamp: new Date().toISOString(),
      configuration: {
        globalConfigLoaded: !!globalConfig,
        routeConfigsCount: routeConfigs.length
      },
      availableRoutes: routeConfigs.map(config => ({
        method: config.method,
        path: config.path,
        conditionsCount: config.conditions?.length || 0
      })),
      documentation: {
        readme: "Visit /docs for comprehensive documentation",
        admin: "Visit /admin for configuration management",
        quickReference: "Visit /docs/quick for quick reference guide"
      }
    });
  }
}