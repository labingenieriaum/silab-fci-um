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
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
@Permissions("usuarios:gestionar")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(user, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto
  ) {
    return this.usersService.update(user, id, dto);
  }

  @Patch(":id/activate")
  activate(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.usersService.setActive(user, id, true);
  }

  @Patch(":id/deactivate")
  deactivate(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.usersService.setActive(user, id, false);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.usersService.remove(user, id);
  }
}
