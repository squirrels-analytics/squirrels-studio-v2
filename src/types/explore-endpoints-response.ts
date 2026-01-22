export interface ExploreEndpointsResponse {
  origin?: string;
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
  "health_url": "/analytics/expenses/v1/health",
  "api_versions": {
    "0": {
      "project_metadata_url": "/analytics/expenses/v1/api/0",
      "documentation_routes": {
        "swagger_url": "/analytics/expenses/v1/api/0/docs",
        "redoc_url": "/analytics/expenses/v1/api/0/redoc",
        "openapi_url": "/analytics/expenses/v1/api/0/openapi.json"
      }
    }
  },
  "documentation_routes": {
    "swagger_url": "/analytics/expenses/v1/docs",
    "redoc_url": "/analytics/expenses/v1/redoc",
    "openapi_url": "/analytics/expenses/v1/openapi.json"
  },
  "mcp_server_url": "/analytics/expenses/v1/mcp",
  "studio_url": "/analytics/expenses/v1/studio"
}
*/
