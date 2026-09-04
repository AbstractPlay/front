import { expect } from "chai";
import { getDefaultDocumentTitle, SITE_OG_TITLE } from "./siteDocumentTitle";

describe("siteDocumentTitle", () => {
  it("exposes the site og:title string", () => {
    expect(SITE_OG_TITLE).to.equal("Abstract Play: Make Time for Games");
  });

  it("uses the og:title as the document title baseline", () => {
    expect(getDefaultDocumentTitle()).to.include(SITE_OG_TITLE);
  });
});
