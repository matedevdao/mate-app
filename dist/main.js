import { BodyNode } from "@common-module/app";
import { KaiaNFTDisplay, ParsingNFTDataContract, SupportedCollections, } from "matedevdao-common";
const nft = new KaiaNFTDisplay(SupportedCollections.DogeSoundClubMates, 1n)
    .appendTo(BodyNode);
nft.style({
    width: "300px",
    height: "300px",
});
const tokenIds = [];
for (let i = 0; i < 1000; i += 1) {
    tokenIds.push(i);
}
console.log(await ParsingNFTDataContract.getERC721HolderList("0xe47e90c58f8336a2f24bcd9bcb530e2e02e1e8ae", tokenIds));
//# sourceMappingURL=main.js.map