import { compareJsonProperties } from "./compareResponse.helpers";

describe("compareJsonProperties", () => {
  test("compara objetos simples", () => {
    const base = { a: 1, b: 2 };
    const compare = { a: 1, b: 3 };
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([{ key: "b", baseValue: 2, compareValue: 3 }]);
  });

  test("compara objetos anidados", () => {
    const base = { a: 1, b: { c: 2, d: 3 } };
    const compare = { a: 1, b: { c: 2, d: 4 } };
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([{ key: "b.d", baseValue: 3, compareValue: 4 }]);
  });

  test("compara arrays sin matchBy", () => {
    const base = [1, 2, 3];
    const compare = [1, 3, 4];
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([
      { key: "[1]", baseValue: 2, compareValue: 3 },
      { key: "[2]", baseValue: 3, compareValue: 4 }
    ]);
  });

  test("compara arrays de objetos con matchBy", () => {
    const base = [
      { id: 1, name: "John", age: 30 },
      { id: 2, name: "Jane", age: 25 }
    ];
    const compare = [
      { id: 2, name: "Jane", age: 26 },
      { id: 1, name: "John", age: 30 },
      { id: 3, name: "Bob", age: 40 }
    ];
    const result = compareJsonProperties(base, compare, { matchBy: "id" });
    expect(result).toEqual([
      { key: "[1].age", baseValue: 25, compareValue: 26 },
      {
        key: "[2]",
        baseValue: undefined,
        compareValue: { id: 3, name: "Bob", age: 40 }
      }
    ]);
  });

  test("ignora propiedades especificadas en wildcard", () => {
    const base = { a: 1, b: 2, c: { d: 3, e: 4 } };
    const compare = { a: 2, b: 2, c: { d: 4, e: 4 } };
    const result = compareJsonProperties(base, compare, {
      wildcard: ["a", "c.d"]
    });
    expect(result).toEqual([]);
  });

  test("maneja tipos diferentes", () => {
    const base = { a: 1, b: "2" };
    const compare = { a: "1", b: 2 };
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([
      { key: "a", baseValue: 1, compareValue: "1" },
      { key: "b", baseValue: "2", compareValue: 2 }
    ]);
  });

  test("maneja propiedades faltantes", () => {
    const base = { a: 1, b: 2 };
    const compare = { a: 1, c: 3 };
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([
      { key: "b", baseValue: 2, compareValue: undefined },
      { key: "c", baseValue: undefined, compareValue: 3 }
    ]);
  });

  test("maneja arrays de diferentes longitudes", () => {
    const base = [1, 2, 3];
    const compare = [1, 2, 3, 4];
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([
      { key: "[3]", baseValue: undefined, compareValue: 4 }
    ]);
  });

  test("maneja valores null", () => {
    const base = { a: null, b: 2 };
    const compare = { a: 1, b: null };
    const result = compareJsonProperties(base, compare);
    expect(result).toEqual([
      { key: "a", baseValue: null, compareValue: 1 },
      { key: "b", baseValue: 2, compareValue: null }
    ]);
  });

  test("maneja matchBy cuando la propiedad no existe", () => {
    const base = [{ id: 1, name: "John" }, { name: "Jane" }];
    const compare = [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" }
    ];
    const result = compareJsonProperties(base, compare, { matchBy: "id" });
    expect(result).toEqual([
      { key: "[1]", baseValue: { name: "Jane" }, compareValue: undefined },
      {
        key: "[1]",
        baseValue: undefined,
        compareValue: { id: 2, name: "Jane" }
      }
    ]);
  });
});
