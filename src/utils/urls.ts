import { webpORpng } from ".";

const format = webpORpng || "png";

export const urls = [
    `${process.env.REACT_APP_ASSETS_IMAGE_URL}${format}/sun-like-bg.${format}`,
    `${process.env.REACT_APP_ASSETS_IMAGE_URL}${format}/propeller.${format}`,
    `${process.env.REACT_APP_ASSETS_IMAGE_URL}${format}/dot.${format}`,
]