import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConnectionFailureConfig, RequestMatchResult, ResponseBody, RouteResponse } from '../types';
import { ConfigLoader } from '../utils/configLoader';
import { TemplateEngine } from '../utils/templateEngine';

export class ResponseProcessor {
  private configLoader: ConfigLoader;
  private dataDir: string;

  constructor(configLoader: ConfigLoader, dataDir: string) {
    this.configLoader = configLoader;
    this.dataDir = dataDir;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const matchResult: RequestMatchResult = res.locals.matchResult;
        
        if (!matchResult) {
          return next();
        }

        // Handle connection failures first
        if (matchResult.matchedResponse.connectionFailure) {
          await this.handleConnectionFailure(req, res, matchResult.matchedResponse.connectionFailure);
          return; // Don't process normal response
        }

        // Apply timeout if configured - when timeout is true, just wait for timeout
        if (matchResult.matchedResponse.timeout === true) {
          const timeoutValue = 5000; // Default 5 seconds when timeout is true
          console.log(`⏰ Request configured to timeout in ${timeoutValue}ms - not processing response`);
          ResponseProcessor.applyTimeout(req, res, timeoutValue);
          return; // Don't process the response, just wait for timeout
        }

        // Apply numeric timeout if configured
        if (typeof matchResult.matchedResponse.timeout === 'number') {
          ResponseProcessor.applyTimeout(req, res, matchResult.matchedResponse.timeout);
          return; // Don't process the response, just wait for timeout
        }

        // Apply latency if configured
        await this.applyLatency(matchResult.matchedResponse);

        // Process the response body
        const processedBody = await this.processResponseBody(
          matchResult.matchedResponse.body,
          matchResult.templateContext
        );

        // Set status code
        res.status(matchResult.matchedResponse.statusCode);

        // Send the response
        res.json(processedBody);

      } catch (error) {
        console.error('❌ Error in response processor:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to process response'
        });
      }
    };
  }

  private async applyLatency(response: RouteResponse): Promise<void> {
    const latencyConfig = response.latency;
    
    if (!latencyConfig || !latencyConfig.enabled) {
      return;
    }

    let delay = 0;

    if (latencyConfig.delay !== undefined) {
      delay = latencyConfig.delay;
    } else if (latencyConfig.min !== undefined && latencyConfig.max !== undefined) {
      delay = Math.floor(Math.random() * (latencyConfig.max - latencyConfig.min + 1)) + latencyConfig.min;
    } else {
      // Use global default
      const globalConfig = this.configLoader.getGlobalConfig();
      if (globalConfig) {
        const globalLatency = globalConfig.defaults.latency;
        if (globalLatency.enabled) {
          delay = Math.floor(Math.random() * (globalLatency.max - globalLatency.min + 1)) + globalLatency.min;
        }
      }
    }

    if (delay > 0) {
      console.log(`⏳ Applying latency: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private async processResponseBody(body: ResponseBody, templateContext: any): Promise<any> {
    let responseData: any = {};

    // Handle direct data
    if (body.data !== undefined) {
      responseData = body.data;
    }

    // Handle data file
    if (body.dataFile) {
      const fileData = await this.loadDataFile(body.dataFile);
      
      if (body.filter) {
        responseData = this.filterData(fileData, body.filter);
      } else {
        responseData = fileData;
      }

      // Apply limit if specified
      if (body.limit && Array.isArray(responseData)) {
        let limitValue: number;
        // Process template variables in limit
        if (typeof body.limit === 'string') {
          const processedLimit = TemplateEngine.processTemplate(body.limit, templateContext);
          limitValue = parseInt(processedLimit, 10);
        } else {
          limitValue = body.limit;
        }
        if (!isNaN(limitValue) && limitValue > 0) {
          responseData = responseData.slice(0, limitValue);
        }
      }
    }

    // Merge with dynamic fields
    if (body.dynamicFields) {
      if (Array.isArray(responseData)) {
        // For array data, merge dynamic fields into each item
        responseData = responseData.map((item: any) => ({
          ...item,
          ...body.dynamicFields
        }));
      } else {
        // For object data, merge directly
        responseData = {
          ...responseData,
          ...body.dynamicFields
        };
      }
    }

    // Process template variables
    const processedData = TemplateEngine.processTemplate(responseData, templateContext);

    // Wrap in standard format if it's just the data
    if (body.dataFile || body.data) {
      return {
        data: processedData
      };
    }

    return processedData;
  }

  private async loadDataFile(fileName: string): Promise<any> {
    try {
      const filePath = path.join(this.dataDir, fileName);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`❌ Error loading data file ${fileName}:`, error);
      throw new Error(`Failed to load data file: ${fileName}`);
    }
  }

  private filterData(data: any[], filter: Record<string, any>): any[] {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => {
      for (const [key, value] of Object.entries(filter)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Handle connection failures
  private async handleConnectionFailure(req: Request, res: Response, config: ConnectionFailureConfig): Promise<void> {
    const delay = config.delay || 0;
    
    if (delay > 0) {
      console.log(`⏳ Waiting ${delay}ms before simulating ${config.type} connection failure`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    switch (config.type) {
      case 'reset':
        console.log(`🔌 Simulating connection reset (ECONNRESET)`);
        // Destroy the socket connection immediately
        req.socket.destroy();
        break;
        
      case 'silent':
        console.log(`🤫 Simulating silent timeout - server will not respond`);
        // Do nothing - just let the request hang
        // Client will eventually timeout based on their own timeout settings
        break;
        
      default:
        console.error(`❌ Unknown connection failure type: ${config.type}`);
        res.status(500).json({ error: 'Invalid connection failure configuration' });
    }
  }

  // Static method to handle timeout
  static applyTimeout(req: Request, res: Response, timeout: number): void {
    console.log(`⏰ Setting timeout for ${timeout}ms`);
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.log(`⚠️ Request timed out after ${timeout}ms`);
        res.status(408).json({
          error: 'Request timeout',
          message: `Request timed out after ${timeout}ms`,
          path: req.path,
          query: req.query
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });
  }
}