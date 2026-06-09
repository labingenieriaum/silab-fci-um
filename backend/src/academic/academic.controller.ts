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
import { AcademicListQueryDto } from "./dto/academic-query.dto";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import { CreateSeedbedDto } from "./dto/create-seedbed.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateSeedbedDto } from "./dto/update-seedbed.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

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

  @Get("academic-users")
  findAcademicUsers(@CurrentUser() user: JwtUser, @Query("facultadId") facultadId?: string) {
    return this.academicService.findAcademicUsers(
      user,
      facultadId ? Number(facultadId) : undefined
    );
  }

  @Get("subjects")
  findSubjects(@CurrentUser() user: JwtUser, @Query() query: AcademicListQueryDto) {
    return this.academicService.findSubjects(user, query);
  }

  @Post("subjects")
  @Permissions("academia:gestionar")
  createSubject(@CurrentUser() user: JwtUser, @Body() dto: CreateSubjectDto) {
    return this.academicService.createSubject(user, dto);
  }

  @Patch("subjects/:id")
  @Permissions("academia:gestionar")
  updateSubject(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto
  ) {
    return this.academicService.updateSubject(user, id, dto);
  }

  @Delete("subjects/:id")
  @Permissions("academia:gestionar")
  removeSubject(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.academicService.removeSubject(user, id);
  }

  @Get("seedbeds")
  findSeedbeds(@CurrentUser() user: JwtUser, @Query() query: AcademicListQueryDto) {
    return this.academicService.findSeedbeds(user, query);
  }

  @Post("seedbeds")
  @Permissions("academia:gestionar")
  createSeedbed(@CurrentUser() user: JwtUser, @Body() dto: CreateSeedbedDto) {
    return this.academicService.createSeedbed(user, dto);
  }

  @Patch("seedbeds/:id")
  @Permissions("academia:gestionar")
  updateSeedbed(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSeedbedDto
  ) {
    return this.academicService.updateSeedbed(user, id, dto);
  }

  @Delete("seedbeds/:id")
  @Permissions("academia:gestionar")
  removeSeedbed(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.academicService.removeSeedbed(user, id);
  }

  @Get("projects")
  findProjects(@CurrentUser() user: JwtUser, @Query() query: AcademicListQueryDto) {
    return this.academicService.findProjects(user, query);
  }

  @Post("projects")
  @Permissions("academia:gestionar")
  createProject(@CurrentUser() user: JwtUser, @Body() dto: CreateProjectDto) {
    return this.academicService.createProject(user, dto);
  }

  @Patch("projects/:id")
  @Permissions("academia:gestionar")
  updateProject(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto
  ) {
    return this.academicService.updateProject(user, id, dto);
  }

  @Delete("projects/:id")
  @Permissions("academia:gestionar")
  removeProject(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.academicService.removeProject(user, id);
  }

  @Get("activities")
  findActivities(@CurrentUser() user: JwtUser, @Query() query: AcademicListQueryDto) {
    return this.academicService.findActivities(user, query);
  }

  @Post("activities")
  @Permissions("academia:gestionar")
  createActivity(@CurrentUser() user: JwtUser, @Body() dto: CreateActivityDto) {
    return this.academicService.createActivity(user, dto);
  }

  @Patch("activities/:id")
  @Permissions("academia:gestionar")
  updateActivity(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto
  ) {
    return this.academicService.updateActivity(user, id, dto);
  }

  @Delete("activities/:id")
  @Permissions("academia:gestionar")
  removeActivity(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.academicService.removeActivity(user, id);
  }
}
