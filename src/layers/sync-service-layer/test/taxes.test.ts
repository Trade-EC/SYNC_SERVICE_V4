// FILEPATH: /home/alex/Documentos/Trabajo/trade/SYNC_SERVICE_V4/SYNC_SERVICE_V4/src/layers/sync-service-layer/transforms/product.transform.test.ts
import { getTaxes } from "../transforms/product.transform";

describe("getTaxes", () => {
  it("should return an empty array if taxesInfo is undefined", () => {
    const result = getTaxes(undefined);
    expect(result).toEqual([]);
  });

  it("should return an array with IVA tax if vatRatePercentage is defined", () => {
    const taxesInfo = { vatRatePercentage: 20 };
    const result = getTaxes(taxesInfo);
    expect(result).toEqual([{ type: "IVA", value: 20 }]);
  });

  it("should return an array with OTROS tax if taxRate is defined", () => {
    const taxesInfo = { taxRate: 15 };
    const result = getTaxes(taxesInfo);
    expect(result).toEqual([{ type: "OTROS", value: 15 }]);
  });

  it("should return an array with both IVA and OTROS taxes if both vatRatePercentage and taxRate are defined", () => {
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const result = getTaxes(taxesInfo);
    expect(result).toEqual([
      { type: "IVA", value: 20 },
      { type: "OTROS", value: 15 }
    ]);
  });
});
