import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LaboratoriesController } from "./laboratories.controller";
import { LaboratoriesService } from "./laboratories.service";

@Module({
  imports: [PrismaModule],
  controllers: [LaboratoriesController],
  providers: [LaboratoriesService]
})
export class LaboratoriesModule {}
