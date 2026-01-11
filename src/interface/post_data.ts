import {
  IsNotEmpty,
  IsInt,
  Min,
  IsString,
  IsDefined,
  ValidateIf,
  ArrayMinSize,
  IsArray,
  ArrayNotEmpty,
  IsUrl,
  ValidateNested,
  IsISO8601,
} from "class-validator";

class ReferenceItem {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDefined()
  @IsString()
  @IsUrl()
  hyperlink!: string;
}

export default class PostData {
  // validator for post title
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("title") !== -1;
    },
    { groups: ["updatePost"] } // only evaluate condition when validating updatePost
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  @IsDefined({ groups: ["addPost", "updatePost"] })
  @IsNotEmpty({ groups: ["addPost", "updatePost"] })
  title!: string;

  // validator for post date
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("date") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  @IsDefined({ groups: ["addPost", "updatePost"] })
  @IsNotEmpty({ groups: ["addPost", "updatePost"] })
  @IsISO8601({ strict: true }, { groups: ["addPost", "updatePost"] })
  date!: string;

  // validator for post content
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("content") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  @IsDefined({ groups: ["addPost", "updatePost"] })
  @IsNotEmpty({ groups: ["addPost", "updatePost"] })
  content!: string;

  // validator for post slug
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("slug") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  @IsDefined({ groups: ["addPost", "updatePost"] })
  @IsNotEmpty({ groups: ["addPost", "updatePost"] })
  slug!: string;

  // validator for meta description
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("meta_description") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  meta_description!: string;

  // validator for meta keyword
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("meta_keyword") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsString({ groups: ["addPost", "updatePost"] })
  meta_keyword!: string;

  // validate for category id
  // category_id
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("category_id") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsDefined({
    groups: ["addPost", "updatePost"],
  })
  @IsNotEmpty({
    groups: ["addPost", "updatePost"],
  })
  @IsInt({
    groups: ["addPost", "updatePost"],
  })
  @Min(1, {
    groups: ["addPost", "updatePost"],
  })
  category_id!: number;

  // validator for tags id list
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("tags_id_list") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsArray({})
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayMinSize(1)
  tags_id_list!: Array<number>;

  // validator for references array
  @ValidateIf(
    (o) => {
      return Object.keys(o).indexOf("reference") !== -1;
    },
    { groups: ["updatePost"] }
  )
  @IsArray({ groups: ["addPost", "updatePost"] })
  @ValidateNested({ each: true, groups: ["addPost", "updatePost"] })
  reference!: ReferenceItem[];

  // validator for id
  // for updatePost group and removePost group only
  @IsDefined({
    groups: ["updatePost", "removePost"],
  })
  @IsNotEmpty({
    groups: ["updatePost", "removePost"],
  })
  @IsInt({
    groups: ["updatePost", "removePost"],
  })
  @Min(1, {
    groups: ["updatePost", "removePost"],
  })
  id!: number;
}
