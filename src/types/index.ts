// Legacy types (keeping for compatibility)
export interface MockData {
    id: number;
    name: string;
    description: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// New dynamic mock server types
export interface RouteCondition {
    when: Record<string, any>;
    response: RouteResponse;
}

export interface RouteResponse {
    statusCode: number;
    body: ResponseBody;
    latency?: LatencyConfig;
    timeout?: number | boolean;
    connectionFailure?: ConnectionFailureConfig;
}

export interface ResponseBody {
    data?: any;
    dataFile?: string;
    filter?: Record<string, any>;
    limit?: number;
    template?: any;
    dynamicFields?: Record<string, any>;
}

export interface LatencyConfig {
    enabled: boolean;
    delay?: number;
    min?: number;
    max?: number;
}

export interface ConnectionFailureConfig {
    type: 'reset' | 'silent';
    delay?: number;
}

export interface RouteConfig {
    method: string;
    path: string;
    conditions?: RouteCondition[];
    defaultResponse: RouteResponse;
}

export interface GlobalConfig {
    defaults: {
        latency: LatencyConfig;
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

export interface TemplateContext {
    params?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
}

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

export interface RequestMatchResult {
    config: RouteConfig;
    matchedResponse: RouteResponse;
    templateContext: TemplateContext;
}