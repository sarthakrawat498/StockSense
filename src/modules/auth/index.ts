/**
 * auth module public API.
 * Only import from here in other modules — never from internal/.
 */
export { AuthService } from "./auth-service";
export type {
  User,
  SignupParams,
  LoginParams,
  AuthResult,
  ResetPasswordRequestParams,
  ResetPasswordConfirmParams,
} from "./types";
