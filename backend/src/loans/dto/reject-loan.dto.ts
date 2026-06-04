import { IsString, MinLength } from "class-validator";

export class RejectLoanDto {
  @IsString()
  @MinLength(3)
  motivoRechazo!: string;
}
