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

  // validate if group = addTag / group = updateTag
  @IsString()
  @IsDefined({
    groups: ["addTag", "updateTag"],
  })
  @IsNotEmpty({
    groups: ["addTag", "updateTag"],
  })
  name!: string;

  // validator for id
  // for updateTag group and removeTag group only
  @IsDefined({
    groups: ["updateTag", "removeTag"],
  })
  @IsNotEmpty({
    groups: ["updateTag", "removeTag"],
  })
  @IsInt({
    groups: ["updateTag", "removeTag"],
  })
  @Min(1, {
    groups: ["updateTag", "removeTag"],
  })
  id!: number;
}
