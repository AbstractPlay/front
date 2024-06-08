import { renderStatic } from "@abstractplay/renderer";

export const fetchGameImage = async (uid, context) => {
    try {
        // console.log(`Fetching game image for ${uid}`);
        const uri = new URL(`https://thumbnails.abstractplay.com/${uid}.json`);
        const res = await fetch(uri);
        const status = res.status;
        let data = null;
        if (status === 200) {
          data = await res.json();
        //   console.log(`Data received: ${JSON.stringify(data)}`);
        }
        if (data !== null) {
            let svg = renderStatic(data, {colourContext: context});
            svg = svg.replace(/&nbsp;/g, `\u00A0`);
            // console.log(`SVG: ${svg.substring(0, 50)}`);
            return svg;
        } else {
            return null;
        }
    } catch (e) {
        console.log(`An error occurred while fetching a game image for ${uid}:\n${e}`);
        return null;
    }
}

export const fetchGameImageJson = async (uid) => {
    try {
        // console.log(`Fetching game image for ${uid}`);
        const uri = new URL(`https://thumbnails.abstractplay.com/${uid}.json`);
        const res = await fetch(uri);
        const status = res.status;
        let data = null;
        if (status === 200) {
          data = await res.json();
        //   console.log(`Data received: ${JSON.stringify(data)}`);
        }
        return data
    } catch (e) {
        console.log(`An error occurred while fetching a game image for ${uid}:\n${e}`);
        return null;
    }
}
