import type { Request } from "express";
import type { JwtUser } from "./jwt-user";

export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}

