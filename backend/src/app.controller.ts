import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";

@Public()
@Controller()
export class AppController {
  @Get()
  getApiInfo() {
    return {
      name: "SILAB FCI API",
      version: "0.1.0",
      status: "ok"
    };
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
