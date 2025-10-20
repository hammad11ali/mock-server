import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RequestMatchResult, ResponseBody, RouteResponse } from '../types';
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

  // Static method to handle timeout
  static applyTimeout(req: Request, res: Response, timeout: number): void {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: `Request timed out after ${timeout}ms`
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });
  }
}