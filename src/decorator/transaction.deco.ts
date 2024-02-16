import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const TransactionParam = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest();
	return req.transaction;
});

export { TransactionParam };