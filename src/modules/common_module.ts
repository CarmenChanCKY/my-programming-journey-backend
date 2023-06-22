const removeHTMLTags = (htmlStr: any) => {
  const regex = new RegExp("</?[^>]+(>|$)", "gi");
  return htmlStr.replaceAll(regex, "");
};

export { removeHTMLTags };
