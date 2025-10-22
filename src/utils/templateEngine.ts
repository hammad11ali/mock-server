import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateContext {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

export class TemplateEngine {
  private static systemVariables: Record<string, () => any> = {
    currentTimestamp: () => new Date().toISOString(),
    currentDate: () => new Date().toISOString().split('T')[0],
    generateId: () => uuidv4(),
    randomNumber: () => Math.floor(Math.random() * 1000) + 1,
    randomEmail: () => `user${Math.floor(Math.random() * 10000)}@example.com`
  };

  static processTemplate(template: any, context: TemplateContext): any {
    if (typeof template === 'string') {
      return this.replaceVariables(template, context);
    }

    if (Array.isArray(template)) {
      return template.map(item => this.processTemplate(item, context));
    }

    if (template && typeof template === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.processTemplate(value, context);
      }
      return result;
    }

    return template;
  }

  private static replaceVariables(str: string, context: TemplateContext): any {
    // Check if the entire string is just a template variable (e.g., "{{body.serviceHeader}}")
    const fullMatch = /^\{\{([^}]+)\}\}$/.exec(str);
    if (fullMatch) {
      const value = this.resolveVariable(fullMatch[1].trim(), context);
      // Return the object/array directly without stringifying
      return value !== undefined ? value : str;
    }
    
    // Replace template variables like {{params.id}}, {{query.status}}, etc.
    return str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const value = this.resolveVariable(variable.trim(), context);
      return value !== undefined ? String(value) : match;
    });
  }

  private static resolveVariable(variable: string, context: TemplateContext): any {
    // Handle system variables
    if (this.systemVariables[variable]) {
      return this.systemVariables[variable]();
    }

    // Handle context variables like params.id, query.status, body.email
    const parts = variable.split('.');
    if (parts.length === 2) {
      const [source, key] = parts;
      
      switch (source) {
        case 'params':
          return context.params?.[key];
        case 'query':
          return context.query?.[key];
        case 'body':
          return context.body?.[key];
        case 'headers':
          return context.headers?.[key];
      }
    }

    // Handle nested object access like body.user.name
    if (parts.length > 2) {
      let current: any = context;
      for (const part of parts) {
        if (current && typeof current === 'object') {
          current = current[part];
        } else {
          return undefined;
        }
      }
      return current;
    }

    return undefined;
  }

  static createContextFromRequest(req: Request): TemplateContext {
    return {
      params: req.params || {},
      query: req.query as Record<string, string> || {},
      body: req.body || {},
      headers: req.headers as Record<string, string> || {}
    };
  }

  static hasTemplateVariables(obj: any): boolean {
    if (typeof obj === 'string') {
      return /\{\{[^}]+\}\}/.test(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(item => this.hasTemplateVariables(item));
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => this.hasTemplateVariables(value));
    }

    return false;
  }
}