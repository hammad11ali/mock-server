import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

export interface RouteConfig {
  method: string;
  path: string;
  conditions?: Array<{
    when: any;
    response: any;
  }>;
  defaultResponse: any;
}

export interface GlobalConfig {
  defaults: {
    latency: {
      enabled: boolean;
      min: number;
      max: number;
    };
    timeout: number;
    statusCode: number;
  };
  server: {
    hotReload: boolean;
    corsEnabled: boolean;
    requestLogging: boolean;
  };
  templateVariables: any;
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private routeConfigs: Map<string, RouteConfig> = new Map();
  private globalConfig: GlobalConfig | null = null;
  private configDir: string;
  private dataDir: string;
  private dataCache: Map<string, any> = new Map();
  private watchers: chokidar.FSWatcher[] = [];

  constructor(configDir: string, dataDir: string) {
    this.configDir = configDir;
    this.dataDir = dataDir;
  }

  static getInstance(configDir?: string, dataDir?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      if (!configDir || !dataDir) {
        throw new Error('ConfigLoader requires configDir and dataDir on first initialization');
      }
      ConfigLoader.instance = new ConfigLoader(configDir, dataDir);
    }
    return ConfigLoader.instance;
  }

  async initialize(): Promise<void> {
    await this.loadGlobalConfig();
    await this.loadRouteConfigs();
    await this.loadDataFiles();
    
    if (this.globalConfig?.server.hotReload) {
      this.setupWatchers();
    }
  }

  private async loadGlobalConfig(): Promise<void> {
    try {
      const globalConfigPath = path.join(this.configDir, 'global.json');
      const configContent = fs.readFileSync(globalConfigPath, 'utf-8');
      this.globalConfig = JSON.parse(configContent);
      console.log('✅ Global config loaded successfully');
    } catch (error) {
      console.error('❌ Error loading global config:', error);
      // Set default config
      this.globalConfig = {
        defaults: {
          latency: { enabled: false, min: 100, max: 500 },
          timeout: 5000,
          statusCode: 200
        },
        server: {
          hotReload: true,
          corsEnabled: true,
          requestLogging: true
        },
        templateVariables: {}
      };
    }
  }

  private async loadRouteConfigs(): Promise<void> {
    try {
      const routesDir = path.join(this.configDir, 'routes');
      await this.loadRouteConfigsFromDirectory(routesDir);
      console.log(`✅ Loaded ${this.routeConfigs.size} route configurations`);
    } catch (error) {
      console.error('❌ Error loading route configs:', error);
    }
  }

  private async loadRouteConfigsFromDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ Routes directory not found: ${dir}`);
      return;
    }

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively load configs from subdirectories
        await this.loadRouteConfigsFromDirectory(itemPath);
      } else if (item.endsWith('.json')) {
        try {
          const configContent = fs.readFileSync(itemPath, 'utf-8');
          const config: RouteConfig = JSON.parse(configContent);
          
          // Create a unique key for the route config
          const configKey = `${config.method.toUpperCase()}:${config.path}`;
          this.routeConfigs.set(configKey, config);
          
          console.log(`📁 Loaded route config: ${configKey} from ${itemPath}`);
        } catch (error) {
          console.error(`❌ Error loading route config from ${itemPath}:`, error);
        }
      }
    }
  }

  private async loadDataFiles(): Promise<void> {
    try {
      if (!fs.existsSync(this.dataDir)) {
        console.warn(`⚠️ Data directory not found: ${this.dataDir}`);
        return;
      }

      const files = fs.readdirSync(this.dataDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.dataDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            this.dataCache.set(file, data);
            console.log(`📄 Loaded data file: ${file}`);
          } catch (error) {
            console.error(`❌ Error loading data file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading data files:', error);
    }
  }

  private setupWatchers(): void {
    // Watch config files
    const configWatcher = chokidar.watch([
      path.join(this.configDir, '**/*.json')
    ], { ignoreInitial: true });

    configWatcher.on('change', async (filePath: string) => {
      console.log(`🔄 Config file changed: ${filePath}`);
      if (filePath.includes('global.json')) {
        await this.loadGlobalConfig();
      } else {
        await this.loadRouteConfigs();
      }
    });

    // Watch data files
    const dataWatcher = chokidar.watch([
      path.join(this.dataDir, '*.json')
    ], { ignoreInitial: true });

    dataWatcher.on('change', async (filePath: string) => {
      console.log(`🔄 Data file changed: ${filePath}`);
      await this.loadDataFiles();
    });

    this.watchers.push(configWatcher, dataWatcher);
  }

  getRouteConfig(method: string, path: string): RouteConfig | undefined {
    const key = `${method.toUpperCase()}:${path}`;
    return this.routeConfigs.get(key);
  }

  getAllRouteConfigs(): RouteConfig[] {
    return Array.from(this.routeConfigs.values());
  }

  getGlobalConfig(): GlobalConfig | null {
    return this.globalConfig;
  }

  getDataFile(filename: string): any {
    return this.dataCache.get(filename);
  }

  getAllDataFiles(): Map<string, any> {
    return new Map(this.dataCache);
  }

  async reload(): Promise<void> {
    this.routeConfigs.clear();
    this.dataCache.clear();
    await this.initialize();
  }

  destroy(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }
}