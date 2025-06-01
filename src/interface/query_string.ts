import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsDefined,
  Equals,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
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

  // validate for keyword
  // if the condition is true, then the following validation will be executed
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("keyword") !== -1;
  })
  @IsNotEmpty()
  @IsString()
  keyword!: string;

  // validate for filter
  // if the condition is true, then the following validation will be executed
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("filter") !== -1;
  })
  @IsNotEmpty()
  @IsString()
  filter!: string;

  // validate for array of int
  // if the condition is true, then the following validation will be executed
  @ValidateIf((o) => {
    return Object.keys(o).indexOf("intArr") !== -1;
  })
  @IsArray({ each: true })
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayMinSize(1)
  intArr!: Array<number>;
}
