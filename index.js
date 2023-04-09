import weaviate from "weaviate-ts-client";
import { readFileSync, readdirSync, writeFileSync } from "fs";

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
});

async function addMeme(imgFile) {
  const img = readFileSync(`./img/${imgFile}`);
  const b64 = Buffer.from(img).toString("base64");

  await client.data
    .creator()
    .withClassName("Meme")
    .withProperties({
      image: b64,
      text: imgFile.split(".")[0].split("_").join(" "),
    })
    .do();
}

async function main() {
  const imgFiles = readdirSync("./img");
  const promises = imgFiles.map(addMeme);
  await Promise.all(promises);

  const test = Buffer.from(readFileSync("test.png")).toString("base64");

  const resImage = await client.graphql
    .get()
    .withClassName("Meme")
    .withFields(["image"])
    .withNearImage({ image: test })
    .withLimit(1)
    .do();

  const result = resImage.data.Get.Meme[0].image;
  writeFileSync("./result.png", result, "base64");

  const schemaConfig = {
    class: "MyMeme",
    vectorizer: "img2vec-neural",
    vectorIndexType: "hnsw",
    moduleConfig: {
      "img2vec-neural": {
        imageFields: ["image"],
      },
    },
    properties: [
      {
        name: "image",
        dataType: ["blob"],
      },
      {
        name: "text",
        dataType: ["string"],
      },
    ],
  };

  await client.schema.classCreator().withClass(schemaConfig).do();
}

main();
