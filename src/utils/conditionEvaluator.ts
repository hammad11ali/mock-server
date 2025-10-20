import { TemplateContext } from './templateEngine';

export interface ConditionValue {
  exists?: boolean;
  equals?: any;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  greaterThan?: number;
  lessThan?: number;
  in?: any[];
}

export interface Condition {
  [key: string]: string | number | boolean | ConditionValue;
}

export class ConditionEvaluator {
  static evaluate(condition: Condition, context: TemplateContext): boolean {
    for (const [key, expectedValue] of Object.entries(condition)) {
      const actualValue = this.getValueFromContext(key, context);
      
      if (!this.matchesCondition(actualValue, expectedValue)) {
        return false;
      }
    }
    return true;
  }

  private static getValueFromContext(key: string, context: TemplateContext): any {
    const parts = key.split('.');
    
    if (parts.length === 2) {
      const [source, field] = parts;
      
      switch (source) {
        case 'params':
          return context.params?.[field];
        case 'query':
          return context.query?.[field];
        case 'body':
          return context.body?.[field];
        case 'headers':
          return context.headers?.[field];
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

  private static matchesCondition(actualValue: any, expectedValue: string | number | boolean | ConditionValue): boolean {
    // Simple equality check
    if (typeof expectedValue === 'string' || typeof expectedValue === 'number' || typeof expectedValue === 'boolean') {
      return actualValue === expectedValue;
    }

    // Complex condition object
    if (typeof expectedValue === 'object' && expectedValue !== null) {
      const condition = expectedValue as ConditionValue;

      // exists check
      if (condition.exists !== undefined) {
        const exists = actualValue !== undefined && actualValue !== null && actualValue !== '';
        return condition.exists === exists;
      }

      // equals check
      if (condition.equals !== undefined) {
        return actualValue === condition.equals;
      }

      // contains check (for strings)
      if (condition.contains !== undefined && typeof actualValue === 'string') {
        return actualValue.includes(condition.contains);
      }

      // startsWith check (for strings)
      if (condition.startsWith !== undefined && typeof actualValue === 'string') {
        return actualValue.startsWith(condition.startsWith);
      }

      // endsWith check (for strings)
      if (condition.endsWith !== undefined && typeof actualValue === 'string') {
        return actualValue.endsWith(condition.endsWith);
      }

      // greaterThan check (for numbers)
      if (condition.greaterThan !== undefined && typeof actualValue === 'number') {
        return actualValue > condition.greaterThan;
      }

      // lessThan check (for numbers)
      if (condition.lessThan !== undefined && typeof actualValue === 'number') {
        return actualValue < condition.lessThan;
      }

      // in check (for arrays)
      if (condition.in !== undefined && Array.isArray(condition.in)) {
        return condition.in.includes(actualValue);
      }
    }

    return false;
  }

  static evaluateMultipleConditions(conditions: Condition[], context: TemplateContext): boolean {
    return conditions.every(condition => this.evaluate(condition, context));
  }

  static findMatchingCondition(conditions: Array<{ when: Condition; response: any }>, context: TemplateContext): any {
    for (const conditionBlock of conditions) {
      if (this.evaluate(conditionBlock.when, context)) {
        return conditionBlock.response;
      }
    }
    return null;
  }
}