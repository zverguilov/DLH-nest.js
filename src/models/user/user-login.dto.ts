import { IsEmail, IsString, IsNotEmpty } from "class-validator";

export class UserLoginDTO {
    @IsEmail()
    @IsNotEmpty()
    email!: string;  
  
    @IsString()
    @IsNotEmpty()
    password!: string;
  }
  