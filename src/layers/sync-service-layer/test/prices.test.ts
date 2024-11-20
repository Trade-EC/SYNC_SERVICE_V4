// FILEPATH: /home/alex/Documentos/Trabajo/trade/SYNC_SERVICE_V4/SYNC_SERVICE_V4/src/layers/sync-service-layer/transforms/product.transform.test.ts

import { calculateGrossPrice } from "../transforms/product.transform";
import { transformPrices } from "../transforms/product.transform";

describe("transformPrices", () => {
  it("should correctly transform prices when all price types are defined", () => {
    const priceInfo = {
      price: 100,
      pointPrice: 50,
      suggestedPointPrice: 75,
      suggestedPrice: 125
    };
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const vendorTaxes = { vatRatePercentage: 3 };

    const result = transformPrices(priceInfo, taxesInfo, vendorTaxes);

    expect(result).toEqual({
      NORMAL: expect.objectContaining({ netPrice: 100 }),
      POINTS: expect.objectContaining({ netPrice: 50 }),
      SUGGESTED: expect.objectContaining({ netPrice: 125 }),
      SUGGESTED_POINTS: expect.objectContaining({ netPrice: 75 })
    });
  });

  it("should set POINTS to null when pointPrice is undefined", () => {
    const priceInfo = {
      price: 100,
      pointPrice: undefined,
      suggestedPointPrice: 75,
      suggestedPrice: 125
    };
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const vendorTaxes = { vatRatePercentage: 3 };

    const result = transformPrices(priceInfo, taxesInfo, vendorTaxes);

    expect(result.POINTS).toBeUndefined();
  });

  it("should set SUGGESTED to null when suggestedPrice is undefined", () => {
    const priceInfo = {
      price: 100,
      pointPrice: 50,
      suggestedPointPrice: 75,
      suggestedPrice: undefined
    };
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const vendorTaxes = { vatRatePercentage: 3 };

    const result = transformPrices(priceInfo, taxesInfo, vendorTaxes);

    expect(result.SUGGESTED).toBeUndefined();
  });

  it("should set SUGGESTED_POINTS to null when suggestedPointPrice is undefined", () => {
    const priceInfo = {
      price: 100,
      pointPrice: 50,
      suggestedPointPrice: undefined,
      suggestedPrice: 125
    };
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const vendorTaxes = { vatRatePercentage: 3 };

    const result = transformPrices(priceInfo, taxesInfo, vendorTaxes);

    expect(result.SUGGESTED_POINTS).toBeUndefined();
  });
  it("should correctly transform prices (grossPrices) when all price types are defined", () => {
    const priceInfo = {
      price: 100,
      pointPrice: 50,
      suggestedPointPrice: 75,
      suggestedPrice: 125
    };
    const taxesInfo = { vatRatePercentage: 20, taxRate: 15 };
    const vendorTaxes = { vatRatePercentage: 3 };

    const result = transformPrices(priceInfo, taxesInfo, vendorTaxes);

    expect(result).toEqual(
      expect.objectContaining({
        NORMAL: expect.objectContaining({
          grossPrice: calculateGrossPrice(100, taxesInfo)
        }),
        SUGGESTED: expect.objectContaining({
          grossPrice: calculateGrossPrice(125, taxesInfo)
        })
      })
    );
  });
});
