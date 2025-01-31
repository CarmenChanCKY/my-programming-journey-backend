import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsDefined,
  Equals,
  ValidateIf,
} from "class-validator";

// https://github.com/typestack/class-validator#validation-groups
export default class QueryStringData {
  // validator for pages

  // validate if group = normalPage
  @IsNotEmpty({
    groups: ["normalPage"],
  })
  @IsInt({
    groups: ["normalPage"],
  })
  @Min(1, {
    groups: ["normalPage"],
  })
  // if the condition is true, then the following validation will be executed
  // for firstPage group only
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

  // validator for id
  // if the condition is true, then the following validation will be executed
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("id") !== -1;
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  id!: number;

  // validator for slug
  // if the condition is true, then the following validation will be executed
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("slug") !== -1;
  })
  @IsNotEmpty()
  @IsString()
  slug!: string;
}
