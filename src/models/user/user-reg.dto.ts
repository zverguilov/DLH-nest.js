import { IsEmail, IsString, IsNotEmpty } from "class-validator";

export class UserRegDTO {
    @IsEmail()
    @IsNotEmpty()
    email!: string; 

    @IsString()
    @IsNotEmpty()
    full_name!: string;
  
    @IsString()
    @IsNotEmpty()
    password!: string;
  }
  