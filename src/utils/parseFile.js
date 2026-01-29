// 靜態資源路徑(好像沒用)
const base = import.meta.env.BASE_URL
export const parsePublicFile = (imgURL) => {
    return `${base}${imgURL}`
}

//動態資源路徑(圖片、檔案)
const fileBase = import.meta.env.VITE_FILE_URL;
export const parseFile = (imgURL) => {
    return `${fileBase}${imgURL}`
}