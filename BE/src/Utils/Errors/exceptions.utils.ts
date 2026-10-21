import { HttpException } from "../utils.barrel";

export class BadRequestException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 400, error);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 401, error);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 403, error);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 404, error);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 409, error);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 422, error);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 500, error);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string, error?: object) {
    super(message, 503, error);
  }
}
