import { BodyNode } from "@common-module/app";
import { KaiaNFTDisplay, SupportedCollections } from "matedevdao-common";

const nft = new KaiaNFTDisplay(SupportedCollections.DogeSoundClubMates, 1n)
  .appendTo(
    BodyNode,
  );

nft.style({
  width: "300px",
  height: "300px",
});
