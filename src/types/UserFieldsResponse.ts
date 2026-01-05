export interface UserField {
  name: string;
  label: string;
  type: string;
  nullable: boolean;
  enum: string[] | null;
  default: unknown;
}

export interface UserFieldsResponse {
  username: UserField;
  access_level: UserField;
  custom_fields: UserField[];
}

export interface UpdateUserModel {
  access_level: 'admin' | 'member';
  custom_fields: Record<string, unknown>;
}

export interface RegisteredUser extends UpdateUserModel {
  username: string;
}

export interface AddUserModel extends RegisteredUser {
  password: string;
}
