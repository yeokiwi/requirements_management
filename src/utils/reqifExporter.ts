import type {
  Project,
  Requirement,
  TraceabilityLink,
  Module,
} from "@/types";

// ---------------------------------------------------------------------------
// ReqIF XML exporter
// ---------------------------------------------------------------------------

/**
 * Generate a ReqIF XML string from project data.
 */
export function exportReqIF(
  project: Project,
  requirements: Requirement[],
  links: TraceabilityLink[],
  modules: Module[],
): string {
  const timestamp = new Date().toISOString();

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd"',
  );
  lines.push('        xmlns:xhtml="http://www.w3.org/1999/xhtml">');

  // -- THE-HEADER --
  lines.push("  <THE-HEADER>");
  lines.push("    <REQ-IF-HEADER>");
  lines.push(`      <COMMENT>Exported from ${escapeXml(project.name)}</COMMENT>`);
  lines.push(`      <CREATION-TIME>${timestamp}</CREATION-TIME>`);
  lines.push(`      <REQ-IF-TOOL-ID>RequirementsManager</REQ-IF-TOOL-ID>`);
  lines.push(`      <REQ-IF-VERSION>1.0</REQ-IF-VERSION>`);
  lines.push(`      <SOURCE-TOOL-ID>RequirementsManager</SOURCE-TOOL-ID>`);
  lines.push(`      <TITLE>${escapeXml(project.name)}</TITLE>`);
  lines.push("    </REQ-IF-HEADER>");
  lines.push("  </THE-HEADER>");

  // -- CORE-CONTENT --
  lines.push("  <CORE-CONTENT>");
  lines.push("    <REQ-IF-CONTENT>");

  // Data types
  lines.push("      <DATATYPES>");
  lines.push(
    '        <DATATYPE-DEFINITION-STRING IDENTIFIER="DT_STRING" LONG-NAME="String" MAX-LENGTH="4096" />',
  );
  lines.push(
    '        <DATATYPE-DEFINITION-XHTML IDENTIFIER="DT_XHTML" LONG-NAME="XHTML" />',
  );
  lines.push("      </DATATYPES>");

  // Spec types
  lines.push("      <SPEC-TYPES>");

  // Spec object type
  lines.push(
    '        <SPEC-OBJECT-TYPE IDENTIFIER="SOT_REQ" LONG-NAME="Requirement">',
  );
  lines.push("          <SPEC-ATTRIBUTES>");
  lines.push(
    '            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="AD_TITLE" LONG-NAME="Title">',
  );
  lines.push("              <TYPE>");
  lines.push(
    "                <DATATYPE-DEFINITION-STRING-REF>DT_STRING</DATATYPE-DEFINITION-STRING-REF>",
  );
  lines.push("              </TYPE>");
  lines.push("            </ATTRIBUTE-DEFINITION-STRING>");
  lines.push(
    '            <ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="AD_DESC" LONG-NAME="Description">',
  );
  lines.push("              <TYPE>");
  lines.push(
    "                <DATATYPE-DEFINITION-XHTML-REF>DT_XHTML</DATATYPE-DEFINITION-XHTML-REF>",
  );
  lines.push("              </TYPE>");
  lines.push("            </ATTRIBUTE-DEFINITION-XHTML>");
  lines.push(
    '            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="AD_STATUS" LONG-NAME="Status">',
  );
  lines.push("              <TYPE>");
  lines.push(
    "                <DATATYPE-DEFINITION-STRING-REF>DT_STRING</DATATYPE-DEFINITION-STRING-REF>",
  );
  lines.push("              </TYPE>");
  lines.push("            </ATTRIBUTE-DEFINITION-STRING>");
  lines.push(
    '            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="AD_PRIORITY" LONG-NAME="Priority">',
  );
  lines.push("              <TYPE>");
  lines.push(
    "                <DATATYPE-DEFINITION-STRING-REF>DT_STRING</DATATYPE-DEFINITION-STRING-REF>",
  );
  lines.push("              </TYPE>");
  lines.push("            </ATTRIBUTE-DEFINITION-STRING>");
  lines.push(
    '            <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="AD_TYPE" LONG-NAME="Type">',
  );
  lines.push("              <TYPE>");
  lines.push(
    "                <DATATYPE-DEFINITION-STRING-REF>DT_STRING</DATATYPE-DEFINITION-STRING-REF>",
  );
  lines.push("              </TYPE>");
  lines.push("            </ATTRIBUTE-DEFINITION-STRING>");
  lines.push("          </SPEC-ATTRIBUTES>");
  lines.push("        </SPEC-OBJECT-TYPE>");

  // Spec relation type
  lines.push(
    '        <SPEC-RELATION-TYPE IDENTIFIER="SRT_LINK" LONG-NAME="Traceability Link" />',
  );

  // Specification type
  lines.push(
    '        <SPECIFICATION-TYPE IDENTIFIER="ST_MODULE" LONG-NAME="Module" />',
  );

  lines.push("      </SPEC-TYPES>");

  // SPEC-OBJECTS (requirements)
  lines.push("      <SPEC-OBJECTS>");
  for (const req of requirements) {
    lines.push(
      `        <SPEC-OBJECT IDENTIFIER="${escapeXml(req.id)}" LONG-NAME="${escapeXml(req.title)}">`,
    );
    lines.push("          <TYPE>");
    lines.push(
      "            <SPEC-OBJECT-TYPE-REF>SOT_REQ</SPEC-OBJECT-TYPE-REF>",
    );
    lines.push("          </TYPE>");
    lines.push("          <VALUES>");
    lines.push(
      `            <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(req.title)}">`,
    );
    lines.push("              <DEFINITION>");
    lines.push(
      "                <ATTRIBUTE-DEFINITION-STRING-REF>AD_TITLE</ATTRIBUTE-DEFINITION-STRING-REF>",
    );
    lines.push("              </DEFINITION>");
    lines.push("            </ATTRIBUTE-VALUE-STRING>");
    lines.push("            <ATTRIBUTE-VALUE-XHTML>");
    lines.push("              <DEFINITION>");
    lines.push(
      "                <ATTRIBUTE-DEFINITION-XHTML-REF>AD_DESC</ATTRIBUTE-DEFINITION-XHTML-REF>",
    );
    lines.push("              </DEFINITION>");
    lines.push(
      `              <THE-VALUE><xhtml:div>${req.description}</xhtml:div></THE-VALUE>`,
    );
    lines.push("            </ATTRIBUTE-VALUE-XHTML>");
    lines.push(
      `            <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(req.status)}">`,
    );
    lines.push("              <DEFINITION>");
    lines.push(
      "                <ATTRIBUTE-DEFINITION-STRING-REF>AD_STATUS</ATTRIBUTE-DEFINITION-STRING-REF>",
    );
    lines.push("              </DEFINITION>");
    lines.push("            </ATTRIBUTE-VALUE-STRING>");
    lines.push(
      `            <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(req.priority)}">`,
    );
    lines.push("              <DEFINITION>");
    lines.push(
      "                <ATTRIBUTE-DEFINITION-STRING-REF>AD_PRIORITY</ATTRIBUTE-DEFINITION-STRING-REF>",
    );
    lines.push("              </DEFINITION>");
    lines.push("            </ATTRIBUTE-VALUE-STRING>");
    lines.push(
      `            <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeXml(req.type)}">`,
    );
    lines.push("              <DEFINITION>");
    lines.push(
      "                <ATTRIBUTE-DEFINITION-STRING-REF>AD_TYPE</ATTRIBUTE-DEFINITION-STRING-REF>",
    );
    lines.push("              </DEFINITION>");
    lines.push("            </ATTRIBUTE-VALUE-STRING>");
    lines.push("          </VALUES>");
    lines.push("        </SPEC-OBJECT>");
  }
  lines.push("      </SPEC-OBJECTS>");

  // SPEC-RELATIONS (links)
  lines.push("      <SPEC-RELATIONS>");
  for (const link of links) {
    lines.push(
      `        <SPEC-RELATION IDENTIFIER="${escapeXml(link.id)}" LONG-NAME="${escapeXml(link.description)}">`,
    );
    lines.push("          <TYPE>");
    lines.push(
      "            <SPEC-RELATION-TYPE-REF>SRT_LINK</SPEC-RELATION-TYPE-REF>",
    );
    lines.push("          </TYPE>");
    lines.push("          <SOURCE>");
    lines.push(
      `            <SPEC-OBJECT-REF>${escapeXml(link.sourceId)}</SPEC-OBJECT-REF>`,
    );
    lines.push("          </SOURCE>");
    lines.push("          <TARGET>");
    lines.push(
      `            <SPEC-OBJECT-REF>${escapeXml(link.targetId)}</SPEC-OBJECT-REF>`,
    );
    lines.push("          </TARGET>");
    lines.push("        </SPEC-RELATION>");
  }
  lines.push("      </SPEC-RELATIONS>");

  // SPECIFICATIONS (modules)
  lines.push("      <SPECIFICATIONS>");
  for (const mod of modules) {
    lines.push(
      `        <SPECIFICATION IDENTIFIER="${escapeXml(mod.id)}" LONG-NAME="${escapeXml(mod.name)}" DESC="${escapeXml(mod.description)}">`,
    );
    lines.push("          <TYPE>");
    lines.push(
      "            <SPECIFICATION-TYPE-REF>ST_MODULE</SPECIFICATION-TYPE-REF>",
    );
    lines.push("          </TYPE>");
    lines.push("          <CHILDREN>");
    for (const reqId of mod.requirementIds) {
      lines.push(
        `            <SPEC-HIERARCHY IDENTIFIER="SH_${escapeXml(mod.id)}_${escapeXml(reqId)}">`,
      );
      lines.push("              <OBJECT>");
      lines.push(
        `                <SPEC-OBJECT-REF>${escapeXml(reqId)}</SPEC-OBJECT-REF>`,
      );
      lines.push("              </OBJECT>");
      lines.push("            </SPEC-HIERARCHY>");
    }
    lines.push("          </CHILDREN>");
    lines.push("        </SPECIFICATION>");
  }
  lines.push("      </SPECIFICATIONS>");

  lines.push("    </REQ-IF-CONTENT>");
  lines.push("  </CORE-CONTENT>");
  lines.push("</REQ-IF>");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
