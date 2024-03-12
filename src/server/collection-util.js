function getContentFilesFromTags(tags) {
    let contentFiles=[];

    for (let tag of tags) {
        if (tag.children) {
            contentFiles=[
                ...contentFiles,
                ...this.getContentFilesFromTags(tag.children)
            ];
        }

        if (tag.tagName=="img" && tag.attributes.src) {
            let fn=tag.attributes.src.split("/").pop();
            contentFiles.push(fn);
        }
    }

    return contentFiles;
}

export function getFieldContentFiles(field, data) {
    switch (field.type) {
        case "image":
            let v=data[field.id];
            if (v)
                return [v];

            return [];
            break;

        case "richtext":
            if (!data[field.id])
                return [];

            return getContentFilesFromTags(parseXml(data[field.id]));
            break;

        default:
            return [];
            break;
    }
}
