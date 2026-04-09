function toPascalCase(value = 'Root') {
  const cleaned = String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  if (!cleaned) return 'Root';

  return cleaned
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function singularize(value) {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('s') && value.length > 1) return value.slice(0, -1);
  return value;
}

function primitiveTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function needsArrayParens(typeName) {
  return typeName.includes('|') && !typeName.startsWith('(');
}

export function generateTypeScriptDefinitions(input, {
  rootName = 'Root',
  declarationKind = 'interface',
  optionalFields = true,
} = {}) {
  const usedNames = new Set();
  const definitions = [];

  function reserveName(baseName) {
    let nextName = toPascalCase(baseName);
    let suffix = 2;

    while (usedNames.has(nextName)) {
      nextName = `${toPascalCase(baseName)}${suffix}`;
      suffix += 1;
    }

    usedNames.add(nextName);
    return nextName;
  }

  function renderDefinition(name, lines) {
    if (declarationKind === 'type') {
      return `export type ${name} = {\n${lines.join('\n')}\n};`;
    }

    return `export interface ${name} {\n${lines.join('\n')}\n}`;
  }

  function mergeObjectValues(name, objects) {
    const definitionName = reserveName(name);
    const keyMap = new Map();

    objects.forEach((objectValue) => {
      Object.entries(objectValue).forEach(([key, child]) => {
        const entry = keyMap.get(key) ?? { values: [], presentCount: 0 };
        entry.values.push(child);
        entry.presentCount += 1;
        keyMap.set(key, entry);
      });
    });

    const lines = Array.from(keyMap.entries()).map(([key, entry]) => {
      const propertyType = inferUnionType(key, entry.values);
      const optional = optionalFields && entry.presentCount < objects.length;
      return `  ${JSON.stringify(key)}${optional ? '?' : ''}: ${propertyType};`;
    });

    definitions.push(renderDefinition(definitionName, lines));
    return definitionName;
  }

  function inferArrayType(name, arrayValue) {
    if (!arrayValue.length) return 'unknown[]';

    const objectItems = arrayValue.filter(
      (item) => item && typeof item === 'object' && !Array.isArray(item)
    );

    if (objectItems.length === arrayValue.length) {
      return `${mergeObjectValues(singularize(name), objectItems)}[]`;
    }

    const itemType = inferUnionType(singularize(name), arrayValue);
    return `${needsArrayParens(itemType) ? `(${itemType})` : itemType}[]`;
  }

  function inferValueType(name, value) {
    const primitiveKind = primitiveTypeOf(value);

    if (primitiveKind === 'string') return 'string';
    if (primitiveKind === 'number') return Number.isInteger(value) ? 'number' : 'number';
    if (primitiveKind === 'boolean') return 'boolean';
    if (primitiveKind === 'undefined') return 'undefined';
    if (primitiveKind === 'null') return 'null';
    if (primitiveKind === 'array') return inferArrayType(name, value);
    if (primitiveKind === 'object') return mergeObjectValues(name, [value]);
    return 'unknown';
  }

  function inferUnionType(name, values) {
    const uniqueTypes = Array.from(new Set(values.map((value) => inferValueType(name, value))));
    return uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes.join(' | ');
  }

  let rootType;
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    rootType = mergeObjectValues(rootName, [input]);
  } else {
    const definitionName = reserveName(rootName);
    const resolvedType = inferValueType(rootName, input);
    if (declarationKind === 'type') {
      definitions.push(`export type ${definitionName} = ${resolvedType};`);
    } else {
      definitions.push(`export type ${definitionName} = ${resolvedType};`);
    }
    rootType = definitionName;
  }

  return {
    rootType,
    output: definitions.reverse().join('\n\n'),
    definitionCount: definitions.length,
  };
}
