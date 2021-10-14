import { providers } from "@0xsequence/multicall";
import { ethers } from "ethers";
import { createObjectCsvWriter } from "csv-writer";

import { LOOT_CONTRACT_ADDR, LOOT_CONTRACT_ABI } from "./constants/loot";

require("dotenv").config();

// A triple of [Token ID, attribute name, attribute value]
// For example: [ 11, 'Hand', 'Ornate Gauntlets of Vitriol' ]
// type AttrInfoTriple = [number, string, string];

type TokenRecord = {
  tokenId: number;
  attributeName: string;
  attributeValue: string;
};

type TokenRecordHeader = {
  id: string;
  title: string;
};

// const LIMIT = 11_111;
const FROM_INDEX = 8001;
const TO_INDEX = 11_111;
const OUTPUT_FILE = `/home/rodyce/deevy_${FROM_INDEX}_${TO_INDEX}.csv`;

const ALCHEMY_API_TOKEN = process.env.ALCHEMY_API_TOKEN;

function getAttributeName(functionName: string) {
  if (functionName.startsWith("get") && functionName.length > 3) {
    return functionName.substring(3);
  }
  return functionName;
}

async function main() {
  const ethersProvider = new ethers.providers.AlchemyProvider(
    "homestead",
    ALCHEMY_API_TOKEN
  );
  const multicallProvider = new providers.MulticallProvider(ethersProvider);
  const loot = new ethers.Contract(
    LOOT_CONTRACT_ADDR,
    LOOT_CONTRACT_ABI,
    multicallProvider
  );

  const functionNames = LOOT_CONTRACT_ABI.map((x) => x.name);
  const csvHeader: TokenRecordHeader[] = [
    {
      id: "tokenId",
      title: "Token ID",
    },
    ...functionNames.map((fname) => {
      return {
        id: getAttributeName(fname),
        title: getAttributeName(fname).toUpperCase(),
      };
    }),
  ];

  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: csvHeader,
    append: false,
  });

  const allAttributes: Promise<TokenRecord>[] = [];

  for (let tokenId = FROM_INDEX; tokenId <= TO_INDEX; tokenId++) {
    const tokenData: Promise<TokenRecord>[] = functionNames.map(
      (fname) =>
        new Promise(async (resolve) => {
          const attributeName = getAttributeName(fname);
          // Invoke loot game contract.
          const attributeValue = await loot[fname](tokenId);
          resolve({ tokenId, attributeName, attributeValue });
        })
    );

    allAttributes.push(...tokenData);
    if (tokenId % 100 === 0) {
      console.log(`Just requested token id: ${tokenId}`);
    }
  }

  const allTokensData: TokenRecord[] = await Promise.all(allAttributes);

  const csvRecords = [];
  let lastTokenId = -1;
  let record: Record<string, string> = {};
  for (const { tokenId, attributeName, attributeValue } of allTokensData) {
    if (lastTokenId === -1) {
      lastTokenId = tokenId;
      record = { tokenId: tokenId.toString() };
    } else if (lastTokenId !== tokenId) {
      lastTokenId = tokenId;
      csvRecords.push(record);
      record = { tokenId: tokenId.toString() };
    }
    record[attributeName] = attributeValue;
  }
  csvRecords.push(record);

  console.log(csvRecords);
  await csvWriter.writeRecords(csvRecords);
  console.log("FINISHED!");
}

main();
