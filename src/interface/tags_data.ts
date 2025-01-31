import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsDefined,
  ValidateIf,
} from "class-validator";

export default class TagsData {
  // validator for tags

  // validate if group = addTag
  @IsString()
  @IsDefined({
    groups: ["addTag", "updateTag"],
  })
  @IsNotEmpty({
    groups: ["addTag", "updateTag"],
  })
  name!: string;

  // validator for id
  // for updateTag group only
  @IsDefined({
    groups: ["updateTag"],
  })
  @IsNotEmpty({
    groups: ["updateTag"],
  })
  @IsInt({
    groups: ["updateTag"],
  })
  @Min(1, {
    groups: ["updateTag"],
  })
  id!: number;
}
