import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class RoleGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const {user} = request;
        
        return user.role === 'Admin'
    }
}