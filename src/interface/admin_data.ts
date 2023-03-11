import {
  IsEmail,
  MinLength,
  IsString,
  IsOptional,
  Matches,
} from "class-validator";

export default class AdminData {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  // at least 8 characters, contains A-Za-z0-9@_-
  @Matches(/^[A-Za-z0-9_@-]{8,}$/i)
  password!: string;

  @IsString()
  @MinLength(16)
  @IsOptional()
  salt!: string;

  @IsString()
  @IsOptional()
  token!: string;
}
