import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const UserParam = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});

export { UserParam };