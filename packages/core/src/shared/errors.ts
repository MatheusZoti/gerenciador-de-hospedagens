export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string) {
    super(`${entity} não encontrado(a)`, "NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Você não tem permissão para esta ação") {
    super(message, "FORBIDDEN");
  }
}
