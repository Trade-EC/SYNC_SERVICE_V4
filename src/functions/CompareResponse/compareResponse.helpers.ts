import { CompareOptions, Difference } from "./compareResponse.types";

export const callHttp = async (
  url: string,
  body: Record<string, any> | null,
  method: string,
  headers: Record<string, string> = {}
) => {
  const reqHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers
  };
  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : null
  });
  const sync = await response.json();
  return sync;
};

export const compareJsonProperties = (
  base: unknown,
  compare: unknown,
  options: CompareOptions = {},
  parentKey = ""
): Difference[] => {
  const differences: Difference[] = [];
  const { wildcard = [], matchBy } = options;

  const shouldIgnore = (key: string): boolean => {
    return wildcard.some(
      wildcardKey =>
        key === wildcardKey ||
        key.endsWith(`.${wildcardKey}`) ||
        key.includes(`[${wildcardKey}]`)
    );
  };

  // Comprobación de tipos
  if (typeof base !== typeof compare) {
    if (!shouldIgnore(parentKey)) {
      return [
        {
          key: parentKey || "root",
          baseValue: base,
          compareValue: compare
        }
      ];
    }
    return [];
  }

  // Manejo de tipos primitivos
  if (typeof base !== "object" || base === null || compare === null) {
    if (base !== compare && !shouldIgnore(parentKey)) {
      return [
        {
          key: parentKey || "root",
          baseValue: base,
          compareValue: compare
        }
      ];
    }
    return [];
  }

  // Manejo de arrays
  if (Array.isArray(base)) {
    if (!Array.isArray(compare)) {
      if (!shouldIgnore(parentKey)) {
        return [
          {
            key: parentKey || "root",
            baseValue: base,
            compareValue: compare
          }
        ];
      }
      return [];
    }

    if (matchBy && typeof matchBy === "string") {
      // Comparación basada en matchBy
      base.forEach((baseItem, index) => {
        const baseItemId = (baseItem as any)[matchBy];
        const completeKey = parentKey ? `${parentKey}[${index}]` : `[${index}]`;

        if (baseItemId === undefined) {
          if (!shouldIgnore(completeKey)) {
            differences.push({
              key: completeKey,
              baseValue: baseItem,
              compareValue: undefined
            });
          }
        } else {
          const compareItem = compare.find(
            (item: any) => item[matchBy] === baseItemId
          );

          if (!compareItem) {
            if (!shouldIgnore(completeKey)) {
              differences.push({
                key: completeKey,
                baseValue: baseItem,
                compareValue: undefined
              });
            }
          } else {
            differences.push(
              ...compareJsonProperties(
                baseItem,
                compareItem,
                options,
                completeKey
              )
            );
          }
        }
      });

      // Check for items in compare that are not in base
      compare.forEach((compareItem: any, index: number) => {
        const compareItemId = compareItem[matchBy];
        if (compareItemId !== undefined) {
          const baseItem = base.find(
            (item: any) => item[matchBy] === compareItemId
          );
          if (!baseItem) {
            const completeKey = parentKey
              ? `${parentKey}[${index}]`
              : `[${index}]`;
            if (!shouldIgnore(completeKey)) {
              differences.push({
                key: completeKey,
                baseValue: undefined,
                compareValue: compareItem
              });
            }
          }
        }
      });
    } else {
      // Comparación basada en índice
      const maxLength = Math.max(base.length, compare.length);
      for (let i = 0; i < maxLength; i++) {
        const completeKey = parentKey ? `${parentKey}[${i}]` : `[${i}]`;
        if (i >= base.length) {
          if (!shouldIgnore(completeKey)) {
            differences.push({
              key: completeKey,
              baseValue: undefined,
              compareValue: compare[i]
            });
          }
        } else if (i >= compare.length) {
          if (!shouldIgnore(completeKey)) {
            differences.push({
              key: completeKey,
              baseValue: base[i],
              compareValue: undefined
            });
          }
        } else {
          differences.push(
            ...compareJsonProperties(base[i], compare[i], options, completeKey)
          );
        }
      }
    }

    return differences;
  }

  // Manejo de objetos
  const baseObj = base as Record<string, unknown>;
  const compareObj = compare as Record<string, unknown>;

  Object.keys(baseObj).forEach(key => {
    const completeKey = parentKey ? `${parentKey}.${key}` : key;

    if (!shouldIgnore(completeKey)) {
      if (!(key in compareObj)) {
        differences.push({
          key: completeKey,
          baseValue: baseObj[key],
          compareValue: undefined
        });
      } else if (typeof baseObj[key] !== typeof compareObj[key]) {
        differences.push({
          key: completeKey,
          baseValue: baseObj[key],
          compareValue: compareObj[key]
        });
      } else if (typeof baseObj[key] === "object" && baseObj[key] !== null) {
        differences.push(
          ...compareJsonProperties(
            baseObj[key],
            compareObj[key],
            options,
            completeKey
          )
        );
      } else if (baseObj[key] !== compareObj[key]) {
        differences.push({
          key: completeKey,
          baseValue: baseObj[key],
          compareValue: compareObj[key]
        });
      }
    }
  });

  // Verificar propiedades en compareObj que no están en baseObj
  Object.keys(compareObj).forEach(key => {
    const completeKey = parentKey ? `${parentKey}.${key}` : key;
    if (!(key in baseObj) && !shouldIgnore(completeKey)) {
      differences.push({
        key: completeKey,
        baseValue: undefined,
        compareValue: compareObj[key]
      });
    }
  });

  return differences;
};
