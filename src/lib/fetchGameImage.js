import { createElement } from "react";
import { render } from "@abstractplay/renderer";
import { nanoid } from "nanoid";

export const fetchGameImage = async (uid, context) => {
    try {
        const json = await fetchGameImageJson(uid);
        if (json !== null) {
            let node = document.createElement("div");
            node.setAttribute("id", nanoid());
            node.setAttribute("style", `width: 100px; height: 100px`);
            console.log(`Rect: ${JSON.stringify(node.getBoundingClientRect())}`);
            console.log(node);
            const opts = {
                divelem: node,
                svgid: `_static_${nanoid()}`,
                colourContext: context,
            };
            let canvas = render(json, opts);
            console.log(`Rendered bbox: ${JSON.stringify(canvas.bbox())}`);
            let svg = canvas.svg();
            svg = svg.replace(/&nbsp;/g, `&#160;`);
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
