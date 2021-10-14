import * as fs from "fs";
import * as path from "path";
import * as csv from "fast-csv";
import { createObjectCsvWriter } from "csv-writer";

const INPUT_FILE = `/home/rodyce/allDeevy.csv`;
const OUTPUT_FILE = `/home/rodyce/deevy_rarity.csv`;

async function main() {
  const [allCards, rarityPerAttribute, totalCards] = await new Promise(
    (resolve, reject) => {
      // Mapping of Attribute -> Value -> Count
      const rarityPerAttribute: Map<string, Map<string, number>> = new Map();

      const allRows: any[] = [];

      function incrementCount(attr: string, value: string) {
        if (!rarityPerAttribute.has(attr)) {
          rarityPerAttribute.set(attr, new Map());
        }
        const attrMap = rarityPerAttribute.get(attr)!;
        if (!attrMap.has(value)) {
          attrMap.set(value, 0);
        }
        attrMap.set(value, attrMap.get(value)! + 1);
      }

      fs.createReadStream(INPUT_FILE)
        .pipe(csv.parse({ headers: true }))
        .on("error", (error) => reject(error))
        .on("data", (row) => {
          allRows.push(row);
          for (const keyName of Object.keys(row)) {
            incrementCount(keyName, row[keyName]);
          }
        })
        .on("end", (rowCount: number) =>
          resolve([allRows, rarityPerAttribute, rowCount])
        );
    }
  );

  const allScores = allCards.map((card: Record<string, string>) => {
    const cardScores: Record<string, string | number> = {};

    let totalCardScore = 0;
    for (const keyName of Object.keys(card)) {
      const occurrence = rarityPerAttribute.get(keyName).get(card[keyName]);
      const finalKeyName = keyName !== "Token ID" ? keyName : "TokenId";

      cardScores[finalKeyName] = card[keyName];
      if (finalKeyName !== "TokenId") {
        cardScores[`${finalKeyName}_rarity`] = `${(
          (occurrence / totalCards) *
          100
        ).toFixed(4)} %`.toString();
        cardScores[`${finalKeyName}_score`] = occurrence;
      }

      totalCardScore += occurrence;
    }

    cardScores["total_score"] = totalCardScore;

    return cardScores;
  });

  const allSortedScores = allScores.sort(
    (a: any, b: any) => a["total_score"] - b["total_score"]
  );

  const allRankedScores = allSortedScores.map((scores: any, index: number) => {
    return { Ranking: index, ...scores };
  });

  const csvHeader: any[] = Object.keys(allRankedScores[0]).map((keyName) => {
    return {
      id: keyName,
      title: keyName.toUpperCase(),
    };
  });

  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: csvHeader,
    append: false,
  });

  console.log(allRankedScores);

  await csvWriter.writeRecords(allRankedScores);
}

main();
