export interface ExploreEndpointsResponse {
  health_url: string;
  api_versions: {
    [key: string]: {
      project_metadata_url: string;
      documentation_routes: {
        swagger_url: string;
        redoc_url: string;
        openapi_url: string;
      };
    };
  };
  documentation_routes: {
    swagger_url: string;
    redoc_url: string;
    openapi_url: string;
  };
  mcp_server_url: string;
  studio_url: string;
}

// Example response:
/* 
{
  "health_url": "http://127.0.0.1:8000/analytics/expenses/v1/health",
  "api_versions": {
    "0": {
      "project_metadata_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0",
      "documentation_routes": {
        "swagger_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/docs",
        "redoc_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/redoc",
        "openapi_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/openapi.json"
      }
    }
  },
  "documentation_routes": {
    "swagger_url": "http://127.0.0.1:8000/analytics/expenses/v1/docs",
    "redoc_url": "http://127.0.0.1:8000/analytics/expenses/v1/redoc",
    "openapi_url": "http://127.0.0.1:8000/analytics/expenses/v1/openapi.json"
  },
  "mcp_server_url": "http://127.0.0.1:8000/analytics/expenses/v1/mcp",
  "studio_url": "http://127.0.0.1:8000/analytics/expenses/v1/studio"
}
*/
