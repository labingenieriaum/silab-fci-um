import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { AcademicService } from "./academic.service";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";

@Controller()
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get("faculties")
  findFaculties(@CurrentUser() user: JwtUser) {
    return this.academicService.findFaculties(user);
  }

  @Post("faculties")
  @Permissions("academia:gestionar")
  createFaculty(@CurrentUser() user: JwtUser, @Body() dto: CreateFacultyDto) {
    return this.academicService.createFaculty(user, dto);
  }

  @Patch("faculties/:id")
  @Permissions("academia:gestionar")
  updateFaculty(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateFacultyDto
  ) {
    return this.academicService.updateFaculty(user, id, dto);
  }

  @Delete("faculties/:id")
  @Permissions("academia:gestionar")
  removeFaculty(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.academicService.removeFaculty(user, id);
  }

  @Get("programs")
  findPrograms(@CurrentUser() user: JwtUser, @Query("facultadId") facultadId?: string) {
    return this.academicService.findPrograms(
      user,
      facultadId ? Number(facultadId) : undefined
    );
  }
}
