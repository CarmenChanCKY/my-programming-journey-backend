import { IsNotEmpty, IsInt, Min, IsString, IsDefined } from "class-validator";

export default class CategoriesData {
  // validator for categories

  // validate if group = addCategory / group = updateCategory
  @IsString()
  @IsDefined({
    groups: ["addCategory", "updateCategory"],
  })
  @IsNotEmpty({
    groups: ["addCategory", "updateCategory"],
  })
  name!: string;

  // validator for id
  // for updateCategory group and removeCategory group only
  @IsDefined({
    groups: ["updateCategory", "removeCategory"],
  })
  @IsNotEmpty({
    groups: ["updateCategory", "removeCategory"],
  })
  @IsInt({
    groups: ["updateCategory", "removeCategory"],
  })
  @Min(1, {
    groups: ["updateCategory", "removeCategory"],
  })
  id!: number;
}
