export interface ProjectMetadataResponse {
  name: string;    // Ex. "my_project"
  name_for_api: string; // Ex. "my-project"
  version: string; // Ex. "1"
  label: string;   // Ex. "My Project"
  description: string;
  auth_type: "optional" | "required";
  password_requirements: {
    min_length: number;
    max_length: number;
  };
  elevated_access_level: "admin" | "member" | "guest";
  api_routes: {
    get_data_catalog_url: string;
    get_parameters_url: string;
    get_dataset_parameters_url: string;
    get_dataset_results_url: string;
    get_dashboard_parameters_url: string;
    get_dashboard_results_url: string;
    trigger_build_url: string;
    get_query_result_url: string;
    get_compiled_model_url: string;
    get_user_session_url: string;
    login_url: string;
    list_providers_url: string;
    login_with_provider_url: string;
    logout_url: string;
    change_password_url: string;
    list_api_keys_url: string;
    create_api_key_url: string;
    revoke_api_key_url: string;
    list_user_fields_url: string;
    list_users_url: string;
    add_user_url: string;
    update_user_url: string;
    delete_user_url: string;
  };
}

// Example response:
/*
{
  "name": "expenses",
  "name_for_api": "expenses",
  "version": "1",
  "label": "Sample Expenses",
  "description": "This is a sample Squirrels project for analyzing expense transactions",
  "auth_type": "optional",
  "elevated_access_level": "admin",
  "api_routes": {
    "get_data_catalog_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/data-catalog",
    "get_parameters_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/parameters",
    "get_dataset_parameters_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/datasets/{dataset_name}/parameters",
    "get_dataset_results_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/datasets/{dataset_name}",
    "get_dashboard_parameters_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/dashboards/{dashboard_name}/parameters",
    "get_dashboard_results_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/dashboards/{dashboard_name}",
    "trigger_build_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/build",
    "get_query_result_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/query-result",
    "get_compiled_model_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/compiled-models/{model_name}",
    "get_user_session_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-session",
    "login_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/login",
    "list_providers_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/providers",
    "login_with_provider_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/providers/{provider_name}/login",
    "logout_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/logout",
    "change_password_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/password",
    "list_api_keys_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/api-keys",
    "create_api_key_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/api-keys",
    "revoke_api_key_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/api-keys/{key_id}",
    "list_user_fields_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-management/user-fields",
    "list_users_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-management/users",
    "add_user_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-management/users",
    "update_user_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-management/users/{username}",
    "delete_user_url": "http://127.0.0.1:8000/analytics/expenses/v1/api/0/auth/user-management/users/{username}"
  }
}
*/