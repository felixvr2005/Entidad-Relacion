// ===================================================================
// SQL PARSER — Parses DDL into table/relationship structures
// ===================================================================

function parseSQL(sql) {
  const tables = [];
  const relationships = [];
  const tableMap = {};

  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/--.*/g, '');
  const normalized = cleaned.replace(/\r\n/g, '\n');

  // ── Extract CREATE TABLE statements using balanced parenthesis parser ──
  const ctRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?(\w+)"?\.)?"?(\w+)"?)\s*\(/gi;
  let match;

  while ((match = ctRegex.exec(normalized)) !== null) {
    const schema = match[1] || null;
    const tableName = match[2];
    const bodyStart = match.index + match[0].length;

    let depth = 1;
    let i = bodyStart;
    let inStr = false;
    let strCh = '';
    while (i < normalized.length && depth > 0) {
      const ch = normalized[i];
      if (inStr) {
        if (ch === strCh && normalized[i - 1] !== '\\') inStr = false;
      } else {
        if (ch === "'" || ch === '"') { inStr = true; strCh = ch; }
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      if (depth > 0) i++;
    }

    if (depth !== 0) continue;

    const body = normalized.substring(bodyStart, i);
    const table = { name: tableName, schema: schema, columns: [], constraints: [] };
    const parts = splitByComma(body);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (/^\s*(CONSTRAINT\s+\w+\s+)?(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\s*/i.test(trimmed)) {
        parseTableConstraint(trimmed, table, tableName, relationships);
      } else {
        const col = parseColumnDef(trimmed, tableName, relationships);
        if (col) table.columns.push(col);
      }
    }

    tables.push(table);
    tableMap[tableName.toLowerCase()] = table;
  }

  // ── Extract ALTER TABLE ... ADD CONSTRAINT (FOREIGN KEY) ──
  const alterRegex = /ALTER\s+TABLE\s+(?:(?:"?\w+"?\.)?"?(\w+)"?)\s+ADD\s+CONSTRAINT\s+"?(\w+)"?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:(?:"?\w+"?\.)?"?(\w+)"?)\s*\(([^)]+)\)/gi;

  while ((match = alterRegex.exec(normalized)) !== null) {
    const fromTable = match[1];
    const constraintName = match[2];
    const fromCols = match[3].split(',').map(c => c.trim().replace(/"/g, ''));
    const toTable = match[4];
    const toCols = match[5].split(',').map(c => c.trim().replace(/"/g, ''));

    relationships.push({
      name: constraintName,
      from: { table: fromTable, columns: fromCols },
      to: { table: toTable, columns: toCols },
      type: fromCols.length > 1 ? 'many-to-many' : 'many-to-one'
    });

    const tbl = tableMap[fromTable.toLowerCase()];
    if (tbl) {
      for (const col of tbl.columns) {
        if (fromCols.map(c => c.toLowerCase()).includes(col.name.toLowerCase())) {
          col.fk = { table: toTable, column: toCols[0] };
        }
      }
    }
  }

  // Deduplicate relationships
  const relSet = new Set();
  const uniqueRels = [];
  for (const rel of relationships) {
    const key = `${rel.from.table}.${rel.from.columns.join(',')}->${rel.to.table}.${rel.to.columns.join(',')}`;
    if (!relSet.has(key.toLowerCase())) {
      relSet.add(key.toLowerCase());
      uniqueRels.push(rel);
    }
  }

  return { tables, relationships: uniqueRels };
}

function splitByComma(str) {
  const parts = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      current += ch;
      if (ch === stringChar && str[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; current += ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseColumnDef(def, tableName, relationships) {
  const tokens = def.trim().split(/\s+/);
  if (tokens.length < 2) return null;

  const name = tokens[0].replace(/"/g, '');
  if (/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|INDEX|KEY)$/i.test(name)) return null;

  const afterName = def.substring(name.length).trim().replace(/^"/, '');

  let typeStr = '';
  let restStartIdx = 0;

  const typeMatch = afterName.match(/^((?:BIGSERIAL|SERIAL|SMALLSERIAL|BIGINT|SMALLINT|INTEGER|INT|INT2|INT4|INT8|TINYINT|MEDIUMINT|DOUBLE\s+PRECISION|REAL|FLOAT|NUMERIC|DECIMAL|MONEY|BOOLEAN|BOOL|BIT|VARBIT|UUID|TEXT|CITEXT|VARCHAR|NVARCHAR|CHARACTER\s+VARYING|CHARACTER|CHAR|NCHAR|BYTEA|BLOB|CLOB|MEDIUMTEXT|LONGTEXT|TINYTEXT|DATE|TIME|TIMETZ|TIMESTAMP|TIMESTAMPTZ|TIMESTAMP\s+WITH(?:OUT)?\s+TIME\s+ZONE|TIME\s+WITH(?:OUT)?\s+TIME\s+ZONE|INTERVAL|INET|CIDR|MACADDR|JSON|JSONB|XML|POINT|LINE|LSEG|BOX|PATH|POLYGON|CIRCLE|TSQUERY|TSVECTOR|ENUM|SET|GEOMETRY|GEOGRAPHY|HSTORE|ARRAY|OID|REGCLASS|INT\[\]|TEXT\[\]|INTEGER\[\]|VARCHAR\[\]|FLOAT\[\])(?:\s*\([^)]*\))?(?:\s*\[\s*\])*)/i);

  if (typeMatch) {
    typeStr = typeMatch[1].trim();
    restStartIdx = typeMatch[0].length;
  } else {
    const simpleType = afterName.match(/^(\w+(?:\s*\([^)]*\))?(?:\s*\[\s*\])*)/i);
    if (simpleType) { typeStr = simpleType[1].trim(); restStartIdx = simpleType[0].length; }
    else { typeStr = tokens[1]; restStartIdx = tokens[1].length; }
  }

  const rest = afterName.substring(restStartIdx).trim();

  const col = {
    name, type: typeStr.toUpperCase(), pk: false, fk: null, unique: false,
    notNull: false, defaultVal: null, check: null, autoIncrement: false,
  };

  if (/SERIAL/i.test(typeStr)) { col.autoIncrement = true; col.notNull = true; }

  if (/PRIMARY\s+KEY/i.test(rest)) { col.pk = true; col.notNull = true; }
  if (/\bUNIQUE\b/i.test(rest)) col.unique = true;
  if (/\bNOT\s+NULL\b/i.test(rest)) col.notNull = true;
  if (/\bNULL\b/i.test(rest) && !/\bNOT\s+NULL\b/i.test(rest)) col.notNull = false;
  if (/AUTO_INCREMENT|AUTOINCREMENT|GENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY/i.test(rest)) col.autoIncrement = true;

  const defaultMatch = rest.match(/DEFAULT\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+)/i);
  if (defaultMatch) col.defaultVal = defaultMatch[1];

  const checkMatch = rest.match(/CHECK\s*(\([^)]*(?:\([^)]*\)[^)]*)*\))/i);
  if (checkMatch) col.check = checkMatch[1];

  const refMatch = rest.match(/REFERENCES\s+(?:(?:"?\w+"?\.)?"?(\w+)"?)\s*\(\s*"?(\w+)"?\s*\)/i);
  if (refMatch) {
    col.fk = { table: refMatch[1], column: refMatch[2] };
    relationships.push({
      name: `fk_${tableName}_${name}`,
      from: { table: tableName, columns: [name] },
      to: { table: refMatch[1], columns: [refMatch[2]] },
      type: 'many-to-one'
    });
  }

  return col;
}

function parseTableConstraint(def, table, tableName, relationships) {
  const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
  if (pkMatch) {
    const cols = pkMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
    for (const col of table.columns) {
      if (cols.map(c => c.toLowerCase()).includes(col.name.toLowerCase())) { col.pk = true; col.notNull = true; }
    }
    table.constraints.push({ type: 'PK', columns: cols });
    return;
  }

  const uqMatch = def.match(/UNIQUE\s*\(([^)]+)\)/i);
  if (uqMatch) {
    const cols = uqMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
    for (const col of table.columns) {
      if (cols.map(c => c.toLowerCase()).includes(col.name.toLowerCase())) col.unique = true;
    }
    table.constraints.push({ type: 'UNIQUE', columns: cols });
    return;
  }

  const fkMatch = def.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:(?:"?\w+"?\.)?"?(\w+)"?)\s*\(([^)]+)\)/i);
  if (fkMatch) {
    const fromCols = fkMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
    const toTable = fkMatch[2];
    const toCols = fkMatch[3].split(',').map(c => c.trim().replace(/"/g, ''));
    for (const col of table.columns) {
      if (fromCols.map(c => c.toLowerCase()).includes(col.name.toLowerCase())) col.fk = { table: toTable, column: toCols[0] };
    }
    relationships.push({
      name: `fk_${tableName}_${fromCols.join('_')}`,
      from: { table: tableName, columns: fromCols },
      to: { table: toTable, columns: toCols },
      type: fromCols.length > 1 ? 'many-to-many' : 'many-to-one'
    });
    table.constraints.push({ type: 'FK', columns: fromCols, refTable: toTable, refColumns: toCols });
    return;
  }

  const chkMatch = def.match(/CHECK\s*(\([^)]*(?:\([^)]*\)[^)]*)*\))/i);
  if (chkMatch) {
    table.constraints.push({ type: 'CHECK', expression: chkMatch[1] });
  }
}
