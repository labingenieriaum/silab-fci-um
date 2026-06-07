import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class SendReturnActEmailDto {
  @IsEmail()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1200)
  message?: string;
}
