#!/usr/bin/node
import { readFile, writeFile } from "fs";
import { renderMap } from "./map-brc";
import { BMMapData } from "./types";

const loadFile = (file: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    readFile(file, "utf-8", (err, data) => {
      if (err) {
        reject(`No such file '${file}'`);
      } else {
        resolve(data.toString());
      }
    });
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });

const parseLines = (content: string) => {
  const parseSingleLine = (
    line: string,
    firstComma?: number,
    secondComma?: number
  ): { name: string; value: string; description: string } =>
    firstComma === undefined
      ? parseSingleLine(line, line.indexOf(","), secondComma)
      : secondComma === undefined
        ? parseSingleLine(line, firstComma, line.indexOf(",", firstComma + 1))
        : {
          name: line.slice(0, firstComma).trim(),
          value: line.slice(firstComma + 1, secondComma),
          description: line.slice(secondComma + 1),
        };

  const valueToNumber = (value: string) => {
    const number = parseFloat(value);
    return isNaN(number) ? value : number;
  };
  const descriptionQuotes = (description: string): string =>
    description.startsWith('"') && description.endsWith('"')
      ? descriptionQuotes(description.slice(1, -1).replace(/\"\"/g, '"'))
      : description;
  const isBad = (line: string) =>
    line.trim().length === 0 || line.startsWith("Note: ") || line === ",,";
  const lines = content
    .split(/(?:\r\n|\n|\r)+/)
    .filter((line) => !isBad(line))
    .map((line) => parseSingleLine(line))
    .map((line) => ({
      ...line, value: valueToNumber(line.value), description: descriptionQuotes(line.description),
    }));

  return lines;
};

const main = async (source: string, destination: string) => {
  if (source === undefined || source.length === 0) {
    console.error("No source file specified");
    console.info("Usage: brc <source> <destination>");
    process.exit(1);
  }
  if (destination === undefined || destination.length === 0) {
    destination = source.indexOf("csv") >= 0 ? source.replace(/csv/g, "svg") : source + ".svg";
  }

  const content = await loadFile(source);
  const lines = parseLines(content);
  const info: BMMapData = lines.reduce<Partial<BMMapData>>((acc, line) => ({ ...acc, [line.name]: line.value }), {}) as BMMapData;
  const map = renderMap(info)

  writeFile(destination, map.svg.outerHTML, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  console.log("map", map.svg.outerHTML);
};
console.log(process.argv);

main(process.argv[2], process.argv[3]);
