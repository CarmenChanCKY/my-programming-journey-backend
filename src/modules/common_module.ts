import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const purifyHTML = (htmlStr: string) => {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  return purify.sanitize(htmlStr, { USE_PROFILES: { html: true } });
};

const searchImageFromHTMLStr = (htmlStr: string) => {
  const dom = new JSDOM(htmlStr);

  const imgSrc: Array<string> = [];

  const imgList = dom.window.document.querySelectorAll("img");

  for (let i = 0; i < imgList.length; i++) {
    const src = imgList[i].getAttribute("src") ?? "";
    if (src !== "") {
      imgSrc.push(src);
    }
  }

  return imgSrc;
};

const removeHTMLTags = (htmlStr: any) => {
  const regex = new RegExp("</?[^>]+(>|$)", "gi");
  return htmlStr.replaceAll(regex, "");
};

export { purifyHTML, searchImageFromHTMLStr, removeHTMLTags };
