import { assert, int, only } from './base';
;
;
;
;
const show = (point) => {
    return `(${point.x}, ${point.y})`;
};
const showFrame = (frame) => {
    return `Frame (${frame.y}, ${frame.x})`;
};
const findBounds = (anim, frame, sprite) => {
    const result = {
        min: { x: anim.width, y: anim.height },
        max: { x: int(0), y: int(0) },
    };
    for (let x = 0; x < anim.width; x++) {
        for (let y = 0; y < anim.height; y++) {
            const index = (frame.x * anim.width + x) +
                (frame.y * anim.height + y) * sprite.width;
            if (sprite.data[4 * index + 3] === 0)
                continue;
            result.min.x = int(Math.min(result.min.x, x));
            result.min.y = int(Math.min(result.min.y, y));
            result.max.x = int(Math.max(result.max.x, x + 1));
            result.max.y = int(Math.max(result.max.y, y + 1));
        }
    }
    return result;
};
const findOrigin = (anim, frame, shadow) => {
    const result = [];
    for (let x = 0; x < anim.width; x++) {
        for (let y = 0; y < anim.height; y++) {
            const index = (frame.x * anim.width + x) +
                (frame.y * anim.height + y) * shadow.width;
            const r = shadow.data[4 * index + 0];
            const g = shadow.data[4 * index + 1];
            const b = shadow.data[4 * index + 2];
            if (r === 255 && g === 255 && b === 255) {
                result.push({ x: int(x), y: int(y) });
            }
        }
    }
    if (result.length !== 1) {
        const error = result.length === 0 ? 'no' : 'multiple';
        throw new Error(`${showFrame(frame)}: ${error} origins found!`);
    }
    return only(result);
};
const main = (anim, sprite, shadow) => {
    assert(sprite.channels === 4);
    assert(shadow.channels === 4);
    assert(sprite.width % anim.width === 0);
    assert(sprite.height % anim.height === 0);
    assert(sprite.width === shadow.width);
    assert(sprite.height === shadow.height);
    const rows = sprite.height / anim.height;
    const cols = sprite.width / anim.width;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const frame = { x: int(col), y: int(row) };
            const bound = findBounds(anim, frame, sprite);
            const point = findOrigin(anim, frame, shadow);
            console.log(`${showFrame(frame)}: center: (${point.x}, ${point.y}); ` +
                `min: ${show(bound.min)}; max: ${show(bound.max)}`);
        }
    }
};
//////////////////////////////////////////////////////////////////////////////
const fs = require('fs');
const pngparse = require('../lib/pngparse');
const xml_parser = require('../lib/xml-parser');
;
const onlyChild = (xml, tag) => {
    return only(xml.childNodes.filter(x => x.tagName === tag));
};
const parseXML = (filename) => {
    const buffer = fs.readFileSync(filename);
    const xml = xml_parser.parseFromString(buffer.toString())[2];
    assert(xml.tagName === 'AnimData');
    const result = [];
    const anim = onlyChild(xml, 'Anims');
    const anims = anim.childNodes.filter(x => x.tagName === 'Anim');
    for (const anim of anims) {
        const name = onlyChild(anim, 'Name').innerXML;
        if (anim.childNodes.some(x => x.tagName === 'CopyOf'))
            continue;
        const width = int(parseInt(onlyChild(anim, 'FrameWidth').innerXML, 10));
        const height = int(parseInt(onlyChild(anim, 'FrameHeight').innerXML, 10));
        result.push({ name, width, height });
    }
    return result;
};
const parsePNG = (filename) => {
    return new Promise((resolve, reject) => {
        pngparse.parseFile(filename, (error, data) => {
            error ? reject(error) : resolve(data);
        });
    });
};
const load = async (root) => {
    const anims = parseXML(`${root}/AnimData.xml`);
    const walk = only(anims.filter(x => x.name === 'Walk'));
    const name = `${root}/Walk-Anim.png`;
    const images = await Promise.all([
        parsePNG(`${root}/Walk-Anim.png`),
        parsePNG(`${root}/Walk-Shadow.png`),
    ]);
    main(walk, images[0], images[1]);
};
load('../SpriteCollab/sprite/0007');
//# sourceMappingURL=images.js.map