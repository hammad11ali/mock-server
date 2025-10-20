import { NextFunction, Request, Response } from 'express';
import { RequestMatchResult, RouteConfig } from '../types';
import { ConditionEvaluator } from '../utils/conditionEvaluator';
import { ConfigLoader } from '../utils/configLoader';
import { TemplateEngine } from '../utils/templateEngine';

export class RequestMatcher {
  private configLoader: ConfigLoader;

  constructor(configLoader: ConfigLoader) {
    this.configLoader = configLoader;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const matchResult = this.findMatchingRoute(req);
        
        if (matchResult) {
          // Store the match result in res.locals for use by response processor
          res.locals.matchResult = matchResult;
          next();
        } else {
          // No matching route found
          res.status(404).json({
            error: 'Route not found',
            method: req.method,
            path: req.path
          });
        }
      } catch (error) {
        console.error('❌ Error in request matcher:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to process request'
        });
      }
    };
  }

  private findMatchingRoute(req: Request): RequestMatchResult | null {
    const { method, path } = req;
    const allConfigs = this.configLoader.getAllRouteConfigs();

    for (const config of allConfigs) {
      if (this.matchesRoute(config, method, path)) {
        const templateContext = TemplateEngine.createContextFromRequest(req);
        const matchedResponse = this.findMatchingResponse(config, templateContext);
        
        if (matchedResponse) {
          return {
            config,
            matchedResponse,
            templateContext
          };
        }
      }
    }

    return null;
  }

  private matchesRoute(config: RouteConfig, method: string, requestPath: string): boolean {
    // Check method match
    if (config.method.toUpperCase() !== method.toUpperCase()) {
      return false;
    }

    // Check path match (including parameters like :id)
    return this.matchesPath(config.path, requestPath);
  }

  private matchesPath(configPath: string, requestPath: string): boolean {
    // Convert route pattern like "/api/users/:id" to regex
    const regexPattern = configPath
      .replace(/:[^/]+/g, '([^/]+)')  // Replace :id with capture group
      .replace(/\//g, '\\/');         // Escape forward slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(requestPath);
  }

  private findMatchingResponse(config: RouteConfig, templateContext: any): any {
    // Check conditions first
    if (config.conditions && config.conditions.length > 0) {
      const matchedCondition = ConditionEvaluator.findMatchingCondition(
        config.conditions,
        templateContext
      );
      
      if (matchedCondition) {
        return matchedCondition;
      }
    }

    // Return default response if no conditions match
    return config.defaultResponse;
  }

  // Helper method to extract path parameters
  static extractPathParams(configPath: string, requestPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    const configSegments = configPath.split('/');
    const requestSegments = requestPath.split('/');
    
    if (configSegments.length !== requestSegments.length) {
      return params;
    }
    
    for (let i = 0; i < configSegments.length; i++) {
      const configSegment = configSegments[i];
      const requestSegment = requestSegments[i];
      
      if (configSegment.startsWith(':')) {
        const paramName = configSegment.substring(1); // Remove ':'
        params[paramName] = requestSegment;
      }
    }
    
    return params;
  }
}