import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsDefined,
  Equals,
  ValidateIf,
} from "class-validator";

//https://github.com/typestack/class-validator#validation-groups
export default class QueryStringData {
  @IsNotEmpty({
    groups: ["normalPage"],
  })
  @IsInt({
    groups: ["normalPage"],
  })
  @Min(1, {
    groups: ["normalPage"],
  })
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("pages") !== -1;
  })
  @IsDefined({
    groups: ["firstPage"],
  })
  @Equals("", {
    groups: ["firstPage"],
  })
  pages!: number;

  @ValidateIf((o) => {
    return Object.keys(o).indexOf("id") !== -1;
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  id!: number;

  @ValidateIf((o) => {
    return Object.keys(o).indexOf("slug") !== -1;
  })
  @IsNotEmpty()
  @IsString()
  slug!: string;
}
