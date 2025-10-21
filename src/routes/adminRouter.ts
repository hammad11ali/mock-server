import { Request, Response, Router } from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { ConfigLoader } from '../utils/configLoader';

const router = Router();

// Serve admin HTML interface
router.get('/', (req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, '..', 'admin.html');
  res.sendFile(htmlPath);
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Helper function to get file stats
async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime.toISOString(),
      isDirectory: stats.isDirectory()
    };
  } catch {
    return null;
  }
}

// Helper function to scan directory recursively
async function scanDirectory(dirPath: string, basePath: string = ''): Promise<any[]> {
  const items: any[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        const children = await scanDirectory(fullPath, relativePath);
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
          count: children.length
        });
      } else if (entry.name.endsWith('.json')) {
        const stats = await getFileStats(fullPath);
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats?.size || 0,
          modified: stats?.modified
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return items.sort((a, b) => {
    // Directories first, then files, alphabetically
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// Get directory structure and file listing
router.get('/files', async (req: Request, res: Response) => {
  try {
    // Use __dirname to get the correct path (works for both src and dist)
    const configPath = path.join(__dirname, '..', 'config');
    const dataPath = path.join(__dirname, '..', 'data');
    
    const [configFiles, dataFiles] = await Promise.all([
      scanDirectory(configPath, 'config'),
      scanDirectory(dataPath, 'data')
    ]);
    
    res.json({
      success: true,
      structure: {
        config: configFiles,
        data: dataFiles
      },
      lastRefresh: ConfigLoader.getLastRefreshTime() || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
});

// Download specific file
router.get('/files/download/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0]; // Get everything after /download/
    const fullPath = path.join(__dirname, '..', filePath);
    
    // Security check - ensure path is within the app directory
    const appPath = path.join(__dirname, '..');
    if (!fullPath.startsWith(appPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const content = await fs.readFile(fullPath, 'utf8');
    const stats = await getFileStats(fullPath);
    
    res.json({
      success: true,
      file: {
        path: filePath,
        content: content,
        size: stats?.size || 0,
        modified: stats?.modified
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

// Upload file(s)
router.post('/files/upload', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const files = (req as any).files as any[];
    const targetPath = req.body.path || '';
    const validateJson = req.body.validateJson !== 'false';
    const autoFormat = req.body.autoFormat !== 'false';
    const backupExisting = req.body.backupExisting !== 'false';
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        // Determine target directory
        let finalPath = targetPath;
        if (!finalPath) {
          // Auto-detect path based on filename
          if (file.originalname.includes('get-') || file.originalname.includes('post-') || 
              file.originalname.includes('put-') || file.originalname.includes('delete-')) {
            finalPath = 'config/routes/';
          } else if (file.originalname === 'global.json') {
            finalPath = 'config/';
          } else {
            finalPath = 'data/';
          }
        }
        
        const fullTargetPath = path.join(__dirname, '..', finalPath, file.originalname);
        
        // Security check
        const appPath = path.join(__dirname, '..');
        if (!fullTargetPath.startsWith(appPath)) {
          results.push({
            filename: file.originalname,
            success: false,
            error: 'Invalid path'
          });
          continue;
        }
        
        // Validate JSON if requested
        let content = file.buffer.toString('utf8');
        if (validateJson) {
          try {
            const parsed = JSON.parse(content);
            if (autoFormat) {
              content = JSON.stringify(parsed, null, 2);
            }
          } catch (jsonError: any) {
            results.push({
              filename: file.originalname,
              success: false,
              error: `Invalid JSON: ${jsonError.message}`
            });
            continue;
          }
        }
        
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(fullTargetPath), { recursive: true });
        
        // Backup existing file if requested
        if (backupExisting) {
          try {
            await fs.access(fullTargetPath);
            const backupPath = `${fullTargetPath}.bak`;
            await fs.copyFile(fullTargetPath, backupPath);
          } catch {
            // File doesn't exist, no backup needed
          }
        }
        
        // Write file
        await fs.writeFile(fullTargetPath, content, 'utf8');
        
        results.push({
          filename: file.originalname,
          success: true,
          path: path.join(finalPath, file.originalname).replace(/\\/g, '/')
        });
      } catch (error: any) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed'
    });
  }
});

// Delete file
router.delete('/files/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(__dirname, '..', filePath);
    const backupBeforeDelete = req.query.backup !== 'false';
    
    // Security check
    const appPath = path.join(__dirname, '..');
    if (!fullPath.startsWith(appPath)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Create backup if requested
    if (backupBeforeDelete) {
      const backupPath = `${fullPath}.deleted.${Date.now()}`;
      await fs.copyFile(fullPath, backupPath);
    }
    
    // Delete file
    await fs.unlink(fullPath);
    
    res.json({
      success: true,
      message: `File ${filePath} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Refresh server configurations
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const scope = req.body.scope || 'all'; // 'all', 'configs', 'data'
    
    let refreshedConfigs = 0;
    let refreshedData = 0;
    let errors: string[] = [];
    
    if (scope === 'all' || scope === 'configs') {
      try {
        refreshedConfigs = await ConfigLoader.reloadConfigurations();
      } catch (error: any) {
        errors.push(`Config reload failed: ${error.message}`);
      }
    }
    
    if (scope === 'all' || scope === 'data') {
      try {
        refreshedData = await ConfigLoader.reloadDataFiles();
      } catch (error: any) {
        errors.push(`Data reload failed: ${error.message}`);
      }
    }
    
    res.json({
      success: errors.length === 0,
      refreshed: {
        configs: refreshedConfigs,
        data: refreshedData,
        timestamp: new Date().toISOString()
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error refreshing server:', error);
    res.status(500).json({
      success: false,
      error: 'Refresh failed'
    });
  }
});

// Get all available routes
router.get('/routes', async (req: Request, res: Response) => {
  try {
    const configLoader = ConfigLoader.getInstance();
    const routeConfigs = configLoader.getAllRouteConfigs();
    
    const routes = routeConfigs.map(config => ({
      method: config.method,
      path: config.path,
      fullPath: `/api${config.path}`,
      conditionsCount: config.conditions?.length || 0,
      conditions: config.conditions?.map(condition => ({
        when: condition.when,
        statusCode: condition.response.statusCode,
        hasLatency: !!condition.response.latency,
        hasTimeout: !!condition.response.timeout
      })) || [],
      defaultResponse: {
        statusCode: config.defaultResponse.statusCode,
        hasLatency: !!config.defaultResponse.latency,
        hasTimeout: !!config.defaultResponse.timeout
      }
    }));

    // Calculate stats
    const stats = {
      totalRoutes: routes.length,
      methodCounts: routes.reduce((acc, route) => {
        acc[route.method] = (acc[route.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalConditions: routes.reduce((sum, route) => sum + route.conditionsCount, 0),
      routesWithConditions: routes.filter(route => route.conditionsCount > 0).length
    };
    
    res.json({
      success: true,
      routes: routes.sort((a, b) => {
        // Sort by method first, then by path
        if (a.method !== b.method) {
          const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
          return methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
        }
        return a.path.localeCompare(b.path);
      }),
      stats
    });
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get routes'
    });
  }
});

// Get server status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      uptime: process.uptime(),
      lastRefresh: ConfigLoader.getLastRefreshTime(),
      loadedConfigs: ConfigLoader.getConfigCount(),
      loadedDataFiles: ConfigLoader.getDataFileCount(),
      memoryUsage: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

export default router;