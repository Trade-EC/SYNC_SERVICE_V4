// FILEPATH: /home/alex/Documentos/Trabajo/trade/SYNC_SERVICE_V4/SYNC_SERVICE_V4/src/layers/sync-service-layer/transforms/product.transform.test.ts
import { getTaxes } from "../transforms/product.transform";

describe("getTaxes", () => {
  it("should return an empty array if taxesInfo is undefined", () => {
    const result = getTaxes(undefined);
    expect(result).toEqual([]);
  });

  it("should return an array with IVA tax if vatRatePercentage is defined", () => {
    const taxesInfo = [{ vatRatePercentage: 20 }];
    const result = getTaxes(taxesInfo);
    expect(result).toEqual([
      {
        code: 20,
        name: "IVA 20%",
        percentage: 20,
        vatRate: "20%",
        vatRateCode: 20
      }
    ]);
  });
});
