import { providers } from "@0xsequence/multicall";
import { ethers } from "ethers";
import { type } from "os";
import { LOOT_CONTRACT_ADDR, LOOT_CONTRACT_ABI } from "./constants/loot";

require("dotenv").config();

// A triple of [Token ID, attribute name, attribute value]
// For example: [ 11, 'Hand', 'Ornate Gauntlets of Vitriol' ]
type AttrInfoTriple = [number, string, string];

const LIMIT = 100;

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
  const allAttributes: Promise<AttrInfoTriple>[] = [];

  for (let tokenId = 0; tokenId < LIMIT; tokenId++) {
    const tokenIdTriples: Promise<AttrInfoTriple>[] = functionNames.map(
      (fname) =>
        new Promise(async (resolve) => {
          const attrName = getAttributeName(fname);
          const attrValue = await loot[fname](tokenId);
          resolve([tokenId, attrName, attrValue]);
        })
    );

    allAttributes.push(...tokenIdTriples);
  }

  const allTriples: AttrInfoTriple[] = await Promise.all(allAttributes);

  console.log(allTriples);
}

main();
