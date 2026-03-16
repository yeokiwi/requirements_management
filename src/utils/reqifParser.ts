// ---------------------------------------------------------------------------
// ReqIF XML parser (browser-side, using DOMParser)
// ---------------------------------------------------------------------------

export interface ParsedReqIFRequirement {
  id: string;
  longName: string;
  description: string;
  type: string;
  attributes: Record<string, string>;
}

export interface ParsedReqIFLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

export interface ParsedReqIFModule {
  id: string;
  longName: string;
  description: string;
  children: string[]; // ordered requirement IDs
}

export interface ParsedReqIFDataType {
  id: string;
  longName: string;
  type: string;
}

export interface ParsedReqIF {
  requirements: ParsedReqIFRequirement[];
  links: ParsedReqIFLink[];
  modules: ParsedReqIFModule[];
  dataTypes: ParsedReqIFDataType[];
}

/**
 * Parse a ReqIF XML string and extract requirements, links, modules, and data types.
 *
 * Mapping:
 *  - SPEC-OBJECT  → requirements
 *  - SPEC-RELATION → links
 *  - SPECIFICATION → modules
 *  - DATATYPE-DEFINITION-* → dataTypes
 */
export function parseReqIF(xmlString: string): ParsedReqIF {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`ReqIF parse error: ${parserError.textContent}`);
  }

  return {
    requirements: parseSpecObjects(doc),
    links: parseSpecRelations(doc),
    modules: parseSpecifications(doc),
    dataTypes: parseDataTypes(doc),
  };
}

// ---------------------------------------------------------------------------
// Internal parsers
// ---------------------------------------------------------------------------

function parseSpecObjects(doc: Document): ParsedReqIFRequirement[] {
  const results: ParsedReqIFRequirement[] = [];
  const elements = doc.getElementsByTagName("SPEC-OBJECT");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const id = el.getAttribute("IDENTIFIER") ?? "";
    const longName = el.getAttribute("LONG-NAME") ?? "";
    const description = el.getAttribute("DESC") ?? "";

    // Try to extract the type reference
    const typeRef =
      el.querySelector("SPEC-OBJECT-TYPE-REF")?.textContent ?? "";

    // Collect attribute values
    const attributes: Record<string, string> = {};
    const attrValues = el.querySelectorAll(
      "ATTRIBUTE-VALUE-STRING, ATTRIBUTE-VALUE-XHTML, ATTRIBUTE-VALUE-ENUMERATION, ATTRIBUTE-VALUE-INTEGER, ATTRIBUTE-VALUE-REAL, ATTRIBUTE-VALUE-BOOLEAN, ATTRIBUTE-VALUE-DATE",
    );
    for (let j = 0; j < attrValues.length; j++) {
      const av = attrValues[j];
      const defRef =
        av.querySelector(
          "ATTRIBUTE-DEFINITION-STRING-REF, ATTRIBUTE-DEFINITION-XHTML-REF, ATTRIBUTE-DEFINITION-ENUMERATION-REF, ATTRIBUTE-DEFINITION-INTEGER-REF, ATTRIBUTE-DEFINITION-REAL-REF, ATTRIBUTE-DEFINITION-BOOLEAN-REF, ATTRIBUTE-DEFINITION-DATE-REF",
        )?.textContent ?? `attr_${j}`;

      // For XHTML values, grab innerHTML; for others, THE-VALUE attribute
      let value = av.getAttribute("THE-VALUE") ?? "";
      if (!value) {
        const xhtmlDiv = av.querySelector("xhtml\\:div, div");
        if (xhtmlDiv) {
          value = xhtmlDiv.innerHTML ?? xhtmlDiv.textContent ?? "";
        }
      }

      attributes[defRef] = value;
    }

    results.push({ id, longName, description, type: typeRef, attributes });
  }

  return results;
}

function parseSpecRelations(doc: Document): ParsedReqIFLink[] {
  const results: ParsedReqIFLink[] = [];
  const elements = doc.getElementsByTagName("SPEC-RELATION");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const id = el.getAttribute("IDENTIFIER") ?? "";
    const sourceId =
      el.querySelector("SOURCE SPEC-OBJECT-REF")?.textContent ?? "";
    const targetId =
      el.querySelector("TARGET SPEC-OBJECT-REF")?.textContent ?? "";
    const typeRef =
      el.querySelector("SPEC-RELATION-TYPE-REF")?.textContent ?? "";

    results.push({ id, sourceId, targetId, type: typeRef });
  }

  return results;
}

function parseSpecifications(doc: Document): ParsedReqIFModule[] {
  const results: ParsedReqIFModule[] = [];
  const elements = doc.getElementsByTagName("SPECIFICATION");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const id = el.getAttribute("IDENTIFIER") ?? "";
    const longName = el.getAttribute("LONG-NAME") ?? "";
    const description = el.getAttribute("DESC") ?? "";

    // Collect ordered hierarchy of SPEC-OBJECT-REFs within this specification
    const children: string[] = [];
    const refs = el.querySelectorAll("SPEC-HIERARCHY OBJECT SPEC-OBJECT-REF");
    // Fallback: try direct SPEC-OBJECT-REF under SPEC-HIERARCHY
    const allRefs =
      refs.length > 0
        ? refs
        : el.querySelectorAll("SPEC-HIERARCHY SPEC-OBJECT-REF");
    for (let j = 0; j < allRefs.length; j++) {
      const refText = allRefs[j].textContent?.trim();
      if (refText) children.push(refText);
    }

    results.push({ id, longName, description, children });
  }

  return results;
}

function parseDataTypes(doc: Document): ParsedReqIFDataType[] {
  const results: ParsedReqIFDataType[] = [];
  const tagPrefixes = [
    "DATATYPE-DEFINITION-STRING",
    "DATATYPE-DEFINITION-XHTML",
    "DATATYPE-DEFINITION-INTEGER",
    "DATATYPE-DEFINITION-REAL",
    "DATATYPE-DEFINITION-BOOLEAN",
    "DATATYPE-DEFINITION-DATE",
    "DATATYPE-DEFINITION-ENUMERATION",
  ];

  for (const tag of tagPrefixes) {
    const elements = doc.getElementsByTagName(tag);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      results.push({
        id: el.getAttribute("IDENTIFIER") ?? "",
        longName: el.getAttribute("LONG-NAME") ?? "",
        type: tag.replace("DATATYPE-DEFINITION-", "").toLowerCase(),
      });
    }
  }

  return results;
}
